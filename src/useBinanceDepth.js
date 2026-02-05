// src/useBinanceDepth.js
import { useState, useEffect, useRef } from 'react';

export function useBinanceDepth(symbol = 'btcusdt') {
  // 儲存深度資料：bids (買單), asks (賣單)
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const ws = useRef(null);
  useEffect(() => {
    setOrderBook({ bids: [], asks: [] });
    // 這次我們訂閱 @depth20，每 1000ms 更新一次，抓前 20 檔深度
    const url = `wss://stream.binance.com:9443/ws/${symbol}@depth20@1000ms`;
    ws.current = new WebSocket(url);
    ws.current.onopen = () => console.log('🌊 Depth Stream Connected');
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // API 回傳格式：{ bids: [[price, qty], ...], asks: [...] }
      setOrderBook({
        bids: message.bids || [],
        asks: message.asks || []
      });
    };
    return () => {
      console.log(`❌ [Depth] Disconnecting from ${symbol}...`);
      if (ws.current) ws.current.close();
    };
  }, [symbol]);
  return orderBook;
}