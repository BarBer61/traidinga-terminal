// frontend/App.tsx (ВРЕМЕННАЯ ВЕРСИЯ ДЛЯ ДИАГНОСТИКИ)
import './index.css';
import React, { useState, useEffect } from 'react';
import { Trade } from './types';
import StatsDashboard from './components/StatsDashboard';

const App: React.FC = () => {
  // --- Логика аутентификации остается без изменений ---
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('ta_auth') === 'true');
  const [password, setPassword] = useState('');

  // --- Создаем немного тестовых данных для графика ---
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('ta_trades');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    // Если данных нет, создаем несколько для примера
    return [
      { id: '1', entryTime: new Date().toISOString(), symbol: 'EURUSD', amount: 10, result: 'WIN', payout: 85 },
      { id: '2', entryTime: new Date().toISOString(), symbol: 'EURUSD', amount: 10, result: 'LOSS', payout: 85 },
      { id: '3', entryTime: new Date().toISOString(), symbol: 'EURUSD', amount: 10, result: 'WIN', payout: 85 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('ta_auth', isAuth.toString());
  }, [isAuth]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password === '1234') {
      setIsAuth(true);
    } else {
      alert('ДОСТУП ЗАПРЕЩЕН: НЕВЕРНЫЙ КЛЮЧ');
    }
  };

  // --- Экран логина (без изменений) ---
  if (!isAuth) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center p-4">
        <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl text-center space-y-6">
           <div className="flex justify-center">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
             </div>
           </div>
           <h1 className="text-xl font-black text-white uppercase tracking-tighter">Traiding<span className="text-indigo-500">A</span> GUARD</h1>
           <form onSubmit={handleLogin} className="space-y-3">
              <input type="password" placeholder="КЛЮЧ ДОСТУПА" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-800 uppercase tracking-widest text-xs" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all">ВОЙТИ В ТЕРМИНАЛ</button>
           </form>
        </div>
      </div>
    );
  }

  // --- РЕНДЕРИНГ ПОСЛЕ ВХОДА ---
  // Мы показываем ТОЛЬКО StatsDashboard внутри простого контейнера
  return (
    <div className="h-screen w-screen bg-black p-10">
      <h1 className="text-white text-2xl mb-4">Диагностика компонента StatsDashboard</h1>
      
      {/* 
        Мы даем контейнеру КОНКРЕТНУЮ высоту. 
        Если график появится здесь, значит проблема в сложной верстке App.tsx.
        Если нет - проблема внутри StatsDashboard.
      */}
      <div className="w-full h-96">
        <StatsDashboard trades={trades} />
      </div>
    </div>
  );
};

export default App;
