// src/Tooltip.jsx
import React from 'react';

export default function Tooltip({ data }) {
  // 如果沒有資料 (沒指到東西)，就不渲染
  if (!data) return null;
  const { x, y, price, volume, type } = data;
  return (
    <div style={{
      position: 'absolute',
      top: y, // 跟隨滑鼠 Y
      left: x, // 跟隨滑鼠 X
      transform: 'translate(15px, -50%)', // 往右偏一點，不要擋住游標
      pointerEvents: 'none', // 關鍵！讓滑鼠事件穿透它，不然會閃爍
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.9)',
      border: `1px solid ${type === 'bids' ? '#00ff41' : '#ff0055'}`, // 買單綠框，賣單紅框
      borderRadius: '4px',
      padding: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap'
    }}>
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #333', marginBottom: '4px', paddingBottom: '2px' }}>
        {type === 'bids' ? '🟢 BUY ORDER' : '🔴 SELL ORDER'}
      </div>
      <div>Price: <span style={{ color: '#fff' }}>${price.toFixed(2)}</span></div>
      <div>Vol:   <span style={{ color: '#aaa' }}>{volume.toFixed(4)}</span></div>
    </div>
  );
}