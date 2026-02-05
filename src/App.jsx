import React, { useState, useMemo, useRef, useCallback } from 'react' // 記得補上 useRef
import SymbolSelector from './SymbolSelector'
import { Canvas, useFrame } from '@react-three/fiber'    // 這裡補上了 useFrame
import { OrbitControls, Stars, Text } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three' // 這裡補上了 THREE (為了用 lerp 運算)
import { useBinanceDepth } from './useBinanceDepth'
import { useBinanceTrade } from './useBinanceTrade'
import TradeRain from './TradeRain'
import StatusPanel from './StatusPanel' // 引入新組件
import { Stats } from '@react-three/drei' // 引入 FPS 監控
import Tooltip from './Tooltip'
// --- 單個長條柱 (Bar) ---
// 修改點 1: 接收 price, volume, type, onHover 參數
function OrderBar({ position, targetHeight, color, price, volume, type, onHover }) {
  const meshRef = useRef()
  const isRed = color.includes('ff00') || color === 'red'; 
  const intensity = isRed ? 5 : 2;
  useFrame((state, delta) => {
    if (!meshRef.current) return
    const currentHeight = meshRef.current.scale.y
    const smoothHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, delta * 10)
    meshRef.current.scale.y = smoothHeight
    meshRef.current.position.y = smoothHeight / 2
  })
  return (
    <mesh 
      ref={meshRef} 
      position={[position[0], 0, position[2]]}
      onPointerOver={(e) => {
        e.stopPropagation(); // 防止事件穿透
        document.body.style.cursor = 'crosshair'; // 改變滑鼠游標
        onHover({
          x: e.clientX,
          y: e.clientY,
          price,
          volume,
          type
        });
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        // 讓 Tooltip 跟著滑鼠跑
        onHover({
          x: e.clientX,
          y: e.clientY,
          price,
          volume,
          type
        });
      }}
      onPointerOut={(e) => {
        document.body.style.cursor = 'default'; // 還原滑鼠游標
        onHover(null); // 清空 Tooltip
      }}
    >
      <boxGeometry args={[0.8, 1, 0.8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={intensity} 
        toneMapped={false}
        transparent 
        opacity={0.8} 
      />
    </mesh>
  )
}
// --- 深度牆 (Wall) ---
function DepthWall({ type, data, onHover }) {
  // 賣單顏色改成比較亮的賽博紅，買單螢光綠
  const color = type === 'bids' ? '#00ff41' : '#ff0066';
  // 1. 🛠️ 新增：計算最大掛單量 (為了歸一化)
  // 這樣不管是 0.1 顆 BTC 還是 100萬顆 DOGE，都能正確縮放
  const maxVolume = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(item => parseFloat(item[1])));
  }, [data]);
  const MAX_VISUAL_HEIGHT = 15; // 設定畫面上的最高高度
  const bars = useMemo(() => {
    return data.map((item, index) => {
      const price = parseFloat(item[0]);
      const quantity = parseFloat(item[1]);
      // 2. 🛠️ 修改：歸一化高度公式
      // (當前量 / 最大量) * 最大高度
      let height = (quantity / maxVolume) * MAX_VISUAL_HEIGHT;
      // 防呆：太小的給它一點點高度，不然會看不見
      height = Math.max(0.1, height);
      let xPos = 0;
      if (type === 'bids') {
        xPos = -1 - (index * 1.0); 
      } else {
        xPos = 1 + (index * 1.0);
      }
      return (
        <OrderBar 
          key={`${type}-${index}`} 
          position={[xPos, 0, 0]} 
          targetHeight={height} // 使用算出來的新高度
          color={color}
          price={price}
          volume={quantity}
          type={type}
          onHover={onHover}
        />
      );
    });
  }, [data, type, onHover, color, maxVolume]); // 記得依賴要把 maxVolume 加進去
  return <group>{bars}</group>;
}
// --- 主程式 ---
export default function App() {
  // 1. 狀態提升 (Lifting State Up)：把 symbol 管理放在最上層
  const [symbol, setSymbol] = useState('btcusdt');
  const [latency, setLatency] = useState(0); // 新增延遲狀態
  const [particleCount, setParticleCount] = useState(0); // 雖然我們現在沒真的算數量，先做樣子
  const { bids, asks } = useBinanceDepth(symbol);
  const [tooltipData, setTooltipData] = useState(null);
  // 1. 建立一個 ref 來控制粒子系統
  const rainRef = useRef();
  // 2. 定義當交易發生時要執行的動作 (使用 useCallback 避免不必要的更新)
  const handleTrade = useCallback((tradeData) => {
    // 1. 計算延遲
    const now = Date.now();
    // 有時候兩邊時鐘不同步會變成負數，取絕對值或設為 0
    const currentLatency = Math.max(0, now - tradeData.eventTime);
    // 為了效能，不要每一筆交易都更新 React State (不然會卡死)
    // 我們可以簡單做個隨機抽樣：每 10 筆更新一次 UI，或者就讓它狂跳 (測試你的電腦效能)
    // 這裡我們先直接更新，如果卡頓我們再來優化
    setLatency(currentLatency);
    // 呼叫粒子系統的 spawn 函式
    if (rainRef.current) {
      rainRef.current.spawn(tradeData.price, tradeData.quantity, tradeData.isSell);
      setParticleCount(prev => (prev > 500 ? 0 : prev + 1));
    }
  }, []);
  // 1. 計算 OBI (使用 useMemo 優化效能)
  const marketMood = React.useMemo(() => {
    // 加總前 20 檔的掛單量
    const totalBids = bids.reduce((acc, item) => acc + parseFloat(item[1]), 0);
    const totalAsks = asks.reduce((acc, item) => acc + parseFloat(item[1]), 0);
    if (totalBids + totalAsks === 0) return 0;
    // 計算比率 (-1 ~ 1)
    const ratio = (totalBids - totalAsks) / (totalBids + totalAsks);
    return ratio;
  }, [bids, asks]);
  // 3. 啟動交易監聽 Hook
  useBinanceTrade(handleTrade, symbol);
  return (
  <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
    {/* UI 層保持不變 */}
    <SymbolSelector currentSymbol={symbol} onSymbolChange={setSymbol} />
    <StatusPanel latency={latency} particleCount={particleCount} symbol={symbol} />
    <Tooltip data={tooltipData} />
    <Canvas camera={{ position: [0, 10, 30], fov: 60 }}>
      <Stats className="stats" />
      {/* ❌ 刪除 (或註解) 這兩行舊的燈光，因為 MarketLights 裡面已經有了 */}
      {/* <ambientLight intensity={0.3} /> */}
      {/* <pointLight position={[10, 20, 10]} intensity={1} /> */}
      {/* ✅ 新增：放入 MarketLights 並傳入 marketMood */}
      <MarketLights mood={marketMood} />
      <Stars radius={100} count={2000} factor={4} fade />
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={3.0} />
      </EffectComposer>
      <group position={[0, -5, 0]}>
        <DepthWall type="bids" data={bids} onHover={setTooltipData} />
        <DepthWall type="asks" data={asks} onHover={setTooltipData} />
        <TradeRain ref={rainRef} symbol={symbol} />
        <Text position={[0, 5, 0]} fontSize={1} color="white">
          {symbol.toUpperCase()} Market Matrix
        </Text>
      </group>
      <OrbitControls />
    </Canvas>
  </div>
)
}
// --- 💡 新增：環境氛圍燈光組件 ---
function MarketLights({ mood }) {
  const ambientRef = useRef();
  useFrame(() => {
    if (ambientRef.current) {
      // 根據 mood 決定目標顏色
      // mood > 0 (買方強) -> 綠色
      // mood < 0 (賣方強) -> 紅色
      // mood = 0 -> 藍色/白色 (中性)
      const targetColor = new THREE.Color();
      if (mood > 0.1) targetColor.set('#00ff41'); // Bullish Green
      else if (mood < -0.1) targetColor.set('#ff0055'); // Bearish Red
      else targetColor.set('#222222'); // Neutral Gray/Blue
      // 使用 lerp 平滑過渡顏色 (才不會閃爍)
      // 0.05 是變色速度，越小越慢
      ambientRef.current.color.lerp(targetColor, 0.05);
      // 也可以根據強度改變亮度
      // 絕對值越大，光越強 (範圍 0.2 ~ 0.8)
      const targetIntensity = 0.2 + Math.abs(mood) * 0.6;
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity, 
        targetIntensity, 
        0.05
      );
    }
  });
  return (
    <group>
      {/* 環境光：負責整體的基底顏色 */}
      <ambientLight ref={ambientRef} intensity={0.3} />
      {/* 點光源：保持場景立體感 (白色) */}
      <pointLight position={[10, 20, 10]} intensity={1} color="white" />
      {/* 底部補光：讓山脈底部有點神秘感 */}
      <spotLight position={[0, -10, 0]} intensity={0.5} color="#00ffff" angle={1} />
    </group>
  )
}