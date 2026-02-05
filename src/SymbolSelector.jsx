// src/SymbolSelector.jsx
import React from 'react';

const COINS = [
  { id: 'btcusdt', name: 'Bitcoin (BTC)' },
  { id: 'ethusdt', name: 'Ethereum (ETH)' },
  { id: 'solusdt', name: 'Solana (SOL)' },
  { id: 'bnbusdt', name: 'Binance Coin (BNB)' },
  { id: 'dogeusdt', name: 'Dogecoin (DOGE)' } // 波動大，適合測試粒子雨
];

export default function SymbolSelector({ currentSymbol, onSymbolChange }) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 100, // 確保在 Canvas 上層
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <label style={{ 
        color: '#888', 
        fontSize: '12px', 
        fontFamily: 'monospace',
        textTransform: 'uppercase'
      }}>
        Target Asset
      </label>
      <select 
        value={currentSymbol}
        onChange={(e) => onSymbolChange(e.target.value)}
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00ffff',
          border: '1px solid #00ffff',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          outline: 'none',
          backdropFilter: 'blur(5px)'
        }}
      >
        {COINS.map(coin => (
          <option key={coin.id} value={coin.id}>
            {coin.name}
          </option>
        ))}
      </select>
      {/* 裝飾用的小燈號 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 5px #00ff41' }} />
        <span style={{ color: '#00ff41', fontSize: '10px', fontFamily: 'monospace' }}>LIVE FEED ACTIVE</span>
      </div>
    </div>
  );
}