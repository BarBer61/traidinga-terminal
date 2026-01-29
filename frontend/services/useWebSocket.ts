// frontend/services/useWebSocket.ts

import { useState, useEffect, useCallback, useRef } from 'react';

// Определяем типы данных, которые приходят с сервера
export interface MarketPulse {
  state: 'СТАБИЛЬНО' | 'УМЕРЕННО' | 'ИМПУЛЬСИВНО' | 'ХАОТИЧНО';
  impulse: number;
  description: string;
}

export interface NewsAlertData {
  // Определите здесь структуру данных для новостного оповещения
  // Например: { headline: string; source: string; url: string; }
  [key: string]: any; 
}

// Тип для возвращаемого значения хука
export interface WebSocketHook {
  isConnected: boolean;
  marketPulse: MarketPulse;
  economicCalendar: any[];
  newsAlert: NewsAlertData | null;
  sendMessage: (type: string, payload: any) => void;
  clearNewsAlert: () => void;
}

export const useWebSocket = (isAuth: boolean): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [economicCalendar, setEconomicCalendar] = useState<any[]>([]);
  const [marketPulse, setMarketPulse] = useState<MarketPulse>({ state: 'СТАБИЛЬНО', impulse: 0, description: 'Подключение...' });
  const [newsAlert, setNewsAlert] = useState<NewsAlertData | null>(null);
  
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    // Эта логика автоматически выбирает правильный адрес сервера
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    console.log(`[WebSocket] Попытка подключения к: ${wsUrl}`);

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[WebSocket] Соединение установлено.');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // console.log('[WebSocket] Получено сообщение:', message); // Для отладки

        switch (message.type) {
          case 'economicCalendar':
            setEconomicCalendar(message.data);
            break;
          case 'marketPulse':
            setMarketPulse(message.data);
            break;
          case 'newsAlert':
            setNewsAlert(message.data);
            break;
          // Ответы от AI будут обрабатываться отдельно
        }
      } catch (error) {
        console.error('[WebSocket] Ошибка парсинга сообщения:', error);
      }
    };

    socket.onclose = () => {
      console.log('[WebSocket] Соединение закрыто. Попытка переподключения через 3 секунды...');
      setIsConnected(false);
      setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      console.error('[WebSocket] Ошибка:', error);
      socket.close(); // Это вызовет onclose и, следовательно, переподключение
    };

    ws.current = socket;
  }, []);

  useEffect(() => {
    if (isAuth) {
      connect();
    }

    return () => {
      if (ws.current) {
        // Предотвращаем переподключение при размонтировании компонента
        ws.current.onclose = null; 
        ws.current.close();
        console.log('[WebSocket] Соединение закрыто при выходе.');
      }
    };
  }, [isAuth, connect]);

  const sendMessage = (type: string, payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data: payload }));
    } else {
      console.error('[WebSocket] Не удалось отправить сообщение: соединение не установлено.');
    }
  };

  const clearNewsAlert = () => setNewsAlert(null);

  return { isConnected, marketPulse, economicCalendar, newsAlert, sendMessage, clearNewsAlert };
};
