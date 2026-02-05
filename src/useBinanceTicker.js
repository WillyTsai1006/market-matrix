// src/useBinanceTicker.js
import { useState, useEffect, useRef } from 'react';

export function useBinanceTicker(symbol = 'btcusdt') {
  // 儲存當前價格
  const [price, setPrice] = useState(0);
  // 儲存價格趨勢：1 為漲 (綠), -1 為跌 (紅), 0 為持平
  const [trend, setTrend] = useState(0);
  const ws = useRef(null);
  const lastPrice = useRef(0);
  useEffect(() => {
    // 連線到幣安公開的 WebSocket
    const url = `wss://stream.binance.com:9443/ws/${symbol}@trade`;
    ws.current = new WebSocket(url);
    ws.current.onopen = () => {
      console.log(`🔌 Connected to Binance: ${symbol}`);
    };
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const currentPrice = parseFloat(message.p); // 'p' 是價格欄位
      // 判斷漲跌邏輯
      if (currentPrice > lastPrice.current) {
        setTrend(1); // 漲
      } else if (currentPrice < lastPrice.current) {
        setTrend(-1); // 跌
      }
      lastPrice.current = currentPrice;
      setPrice(currentPrice);
    };
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [symbol]);
  return { price, trend };
}