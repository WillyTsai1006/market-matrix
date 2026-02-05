// src/StatusPanel.jsx
import React from 'react';

// 這是一個純展示組件 (Presentational Component)
export default function StatusPanel({ latency, particleCount, symbol }) {
  // 根據延遲時間決定顏色 ( <100ms 綠色, <300ms 黃色, >300ms 紅色)
  const getPingColor = (ms) => {
    if (ms < 100) return '#00ff41'; // Green
    if (ms < 300) return '#ffd700'; // Gold
    return '#ff0055'; // Red
  };
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      zIndex: 100,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '10px',
      borderRadius: '4px',
      borderLeft: '2px solid #00ff41', // 賽博龐克風格的左邊框
      backdropFilter: 'blur(4px)'
    }}>
      {/* 標題 */}
      <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
        SYSTEM DIAGNOSTICS
      </div>
      {/* 連線目標 */}
      <div>
        TARGET: <span style={{ color: '#00ffff' }}>{symbol.toUpperCase()}</span>
      </div>
      {/* 連線狀態 (寫死 Online，因為斷線 Hooks 會處理) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        STATUS: <span style={{ color: '#00ff41' }}>OPERATIONAL</span>
        <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: '#00ff41', boxShadow: '0 0 5px #00ff41' 
        }} className="blink" />
      </div>
      {/* 顯示真實延遲 */}
      <div>
        LATENCY: <span style={{ color: getPingColor(latency) }}>{latency} ms</span>
      </div>
      {/* 粒子計數 (這也是一種效能指標) */}
      <div>
        PARTICLES: <span style={{ color: '#fff' }}>{particleCount}</span>
      </div>
      {/* 裝飾用 CSS 動畫：讓綠燈閃爍 */}
      <style>{`
        .blink { animation: blinker 2s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}