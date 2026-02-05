// src/useBinanceTrade.js
import { useEffect, useRef } from 'react';

// 這個 Hook 接收一個 callback 函式作為參數
export function useBinanceTrade(onTrade, symbol = 'btcusdt') {
  const ws = useRef(null);

  useEffect(() => {
    // 訂閱即時成交紀錄 @trade
    const url = `wss://stream.binance.com:9443/ws/${symbol}@trade`;
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // 提取關鍵資訊
      const tradeData = {
        price: parseFloat(message.p), // 成交價
        quantity: parseFloat(message.q), // 成交量 (可以用來決定粒子大小，這裡先暫時不用)
        // isBuyerMaker = true 代表是賣單主動成交 (顯示紅色)
        // isBuyerMaker = false 代表是買單主動成交 (顯示綠色)
        isSell: message.m 
      };
      
      // 執行傳進來的 callback
      if (onTrade) onTrade(tradeData);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [symbol, onTrade]);
}