import React, { useState, useEffect } from 'react';
import { Trade } from './types';
import Header from './components/Header';
import TradeHistory from './components/TradeHistory';
import StatsDashboard from './components/StatsDashboard';
import TradePanel from './components/TradePanel';

const App: React.FC = () => {
    // --- Состояние для всего приложения ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // --- Состояние для формы входа ---
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // --- Логика WebSocket (запускается после входа) ---
    useEffect(() => {
        if (isLoggedIn) {
            const connect = () => {
                console.log('[WebSocket] Попытка подключения к:', import.meta.env.VITE_WS_URL);
                const socket = new WebSocket(import.meta.env.VITE_WS_URL);

                socket.onopen = () => console.log('[WebSocket] Соединение установлено.');
                socket.onmessage = (event) => setTrades(prev => [JSON.parse(event.data), ...prev]);
                socket.onerror = (error) => console.error('[WebSocket] Ошибка:', error);
                socket.onclose = () => {
                    console.log('[WebSocket] Соединение закрыто. Переподключение через 3с.');
                    setTimeout(connect, 3000);
                };
                setWs(socket);
            };
            connect();
        }
        // Очистка при выходе или размонтировании
        return () => {
            if (ws) {
                ws.onclose = null; // Предотвращаем переподключение
                ws.close();
                console.log('[WebSocket] Соединение закрыто.');
            }
        };
    }, [isLoggedIn]);

    // --- Обработчик отправки формы входа ---
    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === import.meta.env.VITE_APP_PASSWORD) {
            setError('');
            setIsLoggedIn(true);
        } else {
            setError('Неверный пароль');
            setPassword('');
        }
    };

    // --- РЕНДЕРИНГ: СНАЧАЛА ПРОВЕРЯЕМ, ВОШЕЛ ЛИ ПОЛЬЗОВАТЕЛЬ ---

    if (!isLoggedIn) {
        // Если не вошел - показываем вашу красивую форму входа
        return (
            <div className="rubber-container bg-black text-slate-100 flex items-center justify-center">
                <div className="w-full max-w-xs">
                    <form onSubmit={handleLoginSubmit} className="bg-zinc-900/50 border border-zinc-800 shadow-2xl rounded-[2rem] px-8 pt-6 pb-8 mb-4">
                        <div className="mb-6">
                            <label className="block text-indigo-400 text-sm font-bold mb-2 tracking-widest uppercase" htmlFor="password">
                                Доступ
                            </label>
                            <input
                                className={`shadow-inner appearance-none border-2 ${error ? 'border-red-500/50' : 'border-zinc-800/50'} rounded-xl w-full py-3 px-4 bg-zinc-900 text-slate-300 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 transition-all`}
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
                        </div>
                        <div className="flex items-center justify-center">
                            <button
                                className="relative bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-all w-full disabled:bg-indigo-800/50"
                                type="submit"
                                disabled={!password}
                            >
                                <span className="absolute top-0 left-0 -ml-1 -mt-1 w-4 h-4 rounded-full bg-indigo-500 animate-ping"></span>
                                <span className="relative">Войти</span>
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-zinc-600 text-xs">
                        &copy;2024. Все права защищены.
                    </p>
                </div>
            </div>
        );
    }

    // Если вошел - показываем основной терминал
    return (
        <div className="rubber-container bg-black text-slate-100">
            <Header />
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
                <div className="lg:col-span-9 grid grid-rows-2 gap-4 min-h-0">
                    <div className="row-span-1 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] shadow-2xl min-h-0 flex items-center justify-center text-zinc-600">
                        {/* Здесь будет основной график TradingView */}
                        <span>TradingView Chart Area</span>
                    </div>
                    <div className="row-span-1 min-h-0">
                        <StatsDashboard trades={trades} />
                    </div>
                </div>
                <div className="lg:col-span-3 grid grid-rows-2 gap-4 min-h-0">
                    <div className="row-span-1 min-h-0">
                        <TradePanel />
                    </div>
                    <div className="row-span-1 min-h-0">
                        <TradeHistory trades={trades} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
