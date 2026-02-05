import React, { useState, useMemo, useRef, useCallback } from 'react' // 記得補上 useRef
import { Canvas, useFrame } from '@react-three/fiber'    // 這裡補上了 useFrame
import { OrbitControls, Stars, Text } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three' // 這裡補上了 THREE (為了用 lerp 運算)
import { useBinanceDepth } from './useBinanceDepth'
import { useBinanceTrade } from './useBinanceTrade'
import TradeRain from './TradeRain'
// --- 單個長條柱 (Bar) ---
// position: [x, y, z], height: 高度, color: 顏色
function OrderBar({ position, targetHeight, color }) {
  const meshRef = useRef()
  // 我們需要一個 ref 來記住目前的高度，因為 React 渲染週期跟動畫幀不同步
  // 這裡我們直接操作 mesh 的 scale.y
  // 判斷：如果是紅色系，發光強度開 5 倍；綠色開 2 倍就好
  const isRed = color.includes('ff00') || color === 'red'; 
  const intensity = isRed ? 5 : 2;
  useFrame((state, delta) => {
    if (!meshRef.current) return
    // 取得目前的高度 (scale.y * 原始高度 1)
    const currentHeight = meshRef.current.scale.y
    // 使用 MathUtils.lerp (Linear Interpolation)
    // 參數：(目前值, 目標值, 速度)
    // delta * 5 代表每秒追趕目標的速度，數字越小越滑順但越慢
    const smoothHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, delta * 10)
    // 更新 Mesh 的縮放 (Y軸)
    meshRef.current.scale.y = smoothHeight
    // 因為 box 的中心點在中間，縮放時會往上下兩邊長
    // 所以我們也要同時更新 position.y，讓它看起來是「從地板長出來」
    // 高度的一半就是它應該在的 Y 位置
    meshRef.current.position.y = smoothHeight / 2
  })
  return (
    // 注意：初始 scale 設為 1，position 從傳入值拿 x, z
    <mesh ref={meshRef} position={[position[0], 0, position[2]]}>
      <boxGeometry args={[0.8, 1, 0.8]} /> {/* 幾何體高度固定為 1，靠 scale 放大 */}
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
// type: 'bids'(買) 或 'asks'(賣), data: [[price, qty], ...]
function DepthWall({ type, data }) {
  // 顏色設定：買單綠色，賣單紅色
  const color = type === 'bids' ? '#00ff41' : '#ff0066';
  // 計算每一個 Bar 的位置
  const bars = useMemo(() => {
    return data.map((item, index) => {
      const quantity = parseFloat(item[1]); // 掛單量 (高度)
      // 正規化高度：把數量縮小一點，不然會衝破螢幕
      // 這裡簡單除以 5，你可以根據實際數量調整
      const height = Math.max(0.1, quantity * 0.5); 
      // 計算 X 軸位置
      // Bids (買單) 往左排 (index * -1)
      // Asks (賣單) 往右排 (index * 1)
      // 加一點間距 (index * 1.2)
      let xPos = 0;
      if (type === 'bids') {
        xPos = -1 - (index * 1.0); 
      } else {
        xPos = 1 + (index * 1.0);
      }
      return (
        <OrderBar 
          key={`${type}-${index}`} // React 需要 key
          position={[xPos, 0, 0]} 
          targetHeight={height}
          color={color} 
        />
      );
    });
  }, [data, type]);
  return <group>{bars}</group>;
}
// --- 主程式 ---
export default function App() {
  const { bids, asks } = useBinanceDepth('btcusdt');
  // 1. 建立一個 ref 來控制粒子系統
  const rainRef = useRef();
  // 2. 定義當交易發生時要執行的動作 (使用 useCallback 避免不必要的更新)
  const handleTrade = useCallback((tradeData) => {
    // 呼叫粒子系統的 spawn 函式
    if (rainRef.current) {
      rainRef.current.spawn(tradeData.price, tradeData.isSell);
    }
  }, []);
  // 3. 啟動交易監聽 Hook
  useBinanceTrade(handleTrade, 'btcusdt');
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas camera={{ position: [0, 10, 30], fov: 60 }}> {/* 視角拉遠一點看下雨 */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 20, 10]} intensity={1} />
        <Stars radius={100} count={2000} factor={4} fade />
        <EffectComposer>
          {/* Bloom 強度調高一點，讓雨滴更亮 */}
          <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={3.0} />
        </EffectComposer>
        <group position={[0, -5, 0]}>
          <DepthWall type="bids" data={bids} />
          <DepthWall type="asks" data={asks} />
          {/* --- 4. 加入粒子雨組件 --- */}
          <TradeRain ref={rainRef} />
          <Text position={[0, 5, 0]} fontSize={1} color="white">
            Market Matrix
          </Text>
        </group>
        <OrbitControls />
      </Canvas>
    </div>
  )
}