import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_COUNT = 500; // 畫面上最多同時存在幾顆粒子
// 使用 forwardRef 讓父組件可以呼叫這個組件裡的函式
const TradeRain = forwardRef((props, ref) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []); // 用來計算矩陣的臨時物件
  // --- 粒子資料結構 ---
  // 不用 useState，因為變動太快了，改用 useRef 來存純資料
  const particles = useRef([]);
  // 格式: [{ position: [x,y,z], velocity: y速度, color: THREE.Color, active: bool }]
  // 初始化粒子池
  useEffect(() => {
    // 預先建立 MAX_COUNT 個空資料格
    particles.current = new Array(MAX_COUNT).fill(0).map(() => ({
      position: [0, -100, 0], // 初始位置藏在地板下
      velocity: 0,
      color: new THREE.Color(),
      active: false
    }));
  }, []);
  // 當 symbol 改變時，清空所有粒子
  useEffect(() => {
    // 直接重置所有粒子狀態
    particles.current.forEach(p => {
      p.active = false;
      p.position[1] = -100;
    });
  }, [props.symbol]);
  // --- 對外公開的函式：發射一顆粒子 ---
  useImperativeHandle(ref, () => ({
    spawn: (price, quantity, isSell) => {
      // 1. 找到一個目前沒在用的粒子槽
      const availableIdx = particles.current.findIndex(p => !p.active);
      if (availableIdx === -1) return; // 池子滿了就忽略
      const p = particles.current[availableIdx];
      p.active = true;
      // 2. 計算發射位置
      const randomOffset = Math.random() * 20; // 0 ~ 20 的隨機範圍
      const xPos = isSell ? (1 + randomOffset) : (-1 - randomOffset);
      p.position = [xPos, 40, 0]; // 從 Y=40 高空落下
      p.velocity = Math.random() * 0.2 + 0.1; // 隨機下落速度
      // 3. 設定顏色 (買綠/賣紅)
      p.color.set(isSell ? '#ff0055' : '#00ff41');
      // 4. 更新 InstancedMesh 的顏色
      meshRef.current.setColorAt(availableIdx, p.color);
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }));
  // --- 動畫迴圈：更新物理 ---
  useFrame(() => {
    if (!meshRef.current) return;
    let needsUpdate = false;
    particles.current.forEach((p, i) => {
      if (!p.active) return; // 沒啟用的跳過
      // 物理下落
      p.position[1] -= p.velocity; // Y軸扣除速度
      // 落地檢測：如果掉到地板下 (Y < 0) 就回收
      if (p.position[1] < 0) {
        p.active = false;
        p.position[1] = -100; // 藏起來
      }
      // 更新矩陣 (把資料同步給 GPU)
      dummy.position.set(...p.position);
      dummy.scale.set(0.2, 0.2, 0.2); // 粒子小一點
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      needsUpdate = true;
    });
    // 如果有粒子在動，告訴 Three.js 需要更新畫面
    if (needsUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    // InstancedMesh: 關鍵所在
    // args: [幾何體, 材質, 數量]
    <instancedMesh ref={meshRef} args={[null, null, MAX_COUNT]}>
      {/* 粒子形狀：球體 */}
      <sphereGeometry args={[0.5, 8, 8]} />
      {/* 材質：配合 Bloom 發光 */}
      <meshStandardMaterial 
        emissiveIntensity={3} 
        toneMapped={false}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  )
});

export default TradeRain;