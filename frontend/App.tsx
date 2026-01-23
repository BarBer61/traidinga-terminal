import React, { useState, useEffect, useMemo } from 'react';
import { AppView, Trade, Broker, RiskSettings } from './types';
import { DEFAULT_BROKERS, DEFAULT_STRATEGIES } from './constants';
// Компоненты
import TradeJournal from './components/TradeJournal';
import StatsDashboard from './components/StatsDashboard';
import TraderCalendar from './components/TraderCalendar';
import NewsPanel from './components/NewsPanel';
import AICore from './components/AICore';
import RiskCalculator from './components/RiskCalculator';
import TradingSessions from './components/TradingSessions';
import MarketStatus from './components/MarketStatus';
import SessionControl from './components/SessionControl';
import NewsAlert from './components/NewsAlert'; // <-- НОВЫЙ ИМПОРТ

// --- НОВЫЕ ТИПЫ ДАННЫХ ---
interface MarketPulse {
  state: 'СТАБИЛЬНО' | 'УМЕРЕННО' | 'ИМПУЛЬСИВНО' | 'ХАОТИЧНО';
  impulse: number;
  description: string;
}

const App: React.FC = () => {
  // ... (все ваши существующие состояния isAuth, password, activeView, trades, brokers, riskSettings остаются без изменений)
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('ta_auth') === 'true');
  const [password, setPassword] = useState('');
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('ta_trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [brokers, setBrokers] = useState<Broker[]>(() => {
    const saved = localStorage.getItem('ta_brokers');
    return saved ? JSON.parse(saved) : DEFAULT_BROKERS;
  });

  const [riskSettings, setRiskSettings] = useState<RiskSettings>(() => {
    const saved = localStorage.getItem('ta_risk_settings');
    return saved ? JSON.parse(saved) : {
      balance: 1000, riskPerTrade: 1, dailyLimit: 5, weeklyLimit: 15, maxDrawdownLimit: 10, currency: 'USD'
    };
  });

  // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ ---
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [economicCalendar, setEconomicCalendar] = useState<any[]>([]);
  const [marketPulse, setMarketPulse] = useState<MarketPulse>({ state: 'СТАБИЛЬНО', impulse: 20, description: 'Подключение...' });
  const [newsAlert, setNewsAlert] = useState<any | null>(null);

  // ... (все ваши существующие useEffect, dailyPnL, handleLogin, addBroker, exportData, importData остаются без изменений)
  useEffect(() => {
    localStorage.setItem('ta_trades', JSON.stringify(trades));
    localStorage.setItem('ta_risk_settings', JSON.stringify(riskSettings));
    localStorage.setItem('ta_brokers', JSON.stringify(brokers));
    localStorage.setItem('ta_auth', isAuth.toString());
  }, [trades, riskSettings, brokers, isAuth]);

  const dailyPnL = useMemo(() => {
    const today = new Date().toDateString();
    return trades
      .filter(t => new Date(t.entryTime).toDateString() === today)
      .reduce((acc, t) => acc + (t.result === 'WIN' ? (t.amount * t.payout / 100) : -t.amount), 0);
  }, [trades]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password === '1234') {
      setIsAuth(true);
    } else {
      alert('ДОСТУП ЗАПРЕЩЕН: НЕВЕРНЫЙ КЛЮЧ');
    }
  };

  const addBroker = (name: string) => {
    if (!name.trim()) return;
    const newBroker = { id: Date.now().toString(), name: name.trim() };
    setBrokers([...brokers, newBroker]);
  };

  const exportData = () => {
    const data = { trades, brokers, riskSettings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traidinga_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.trades) setTrades(data.trades);
        if (data.brokers) setBrokers(data.brokers);
        if (data.riskSettings) setRiskSettings(data.riskSettings);
        alert('ДАННЫЕ УСПЕШНО ИМПОРТИРОВАНЫ');
      } catch (err) {
        alert('ОШИБКА ФОРМАТА ФАЙЛА');
      }
    };
    reader.readAsText(file);
  };

  // --- НОВЫЙ ЭФФЕКТ ДЛЯ WEBSOCKET ---
  useEffect(() => {
    if (!isAuth) return;

    // Определяем адрес WebSocket сервера
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8080`; // Используем тот же хост, но порт 8080

    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket подключен');
        setIsWsConnected(true);
        setWs(socket);
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'ECONOMIC_CALENDAR_UPDATE':
            setEconomicCalendar(message.payload);
            break;
          case 'MARKET_PULSE_UPDATE':
            setMarketPulse(message.payload);
            break;
          case 'NEWS_ALERT':
            setNewsAlert(message.payload);
            break;
          // Ответ от Gemini будет обрабатываться в компоненте AICore
        }
      };

      socket.onclose = () => {
        console.log('WebSocket отключен. Попытка переподключения через 3 секунды...');
        setIsWsConnected(false);
        setWs(null);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
        socket.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [isAuth]);

  // --- ВАША РАЗМЕТКА ---
  if (!isAuth) {
    // ... (экран логина остается без изменений)
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center p-4">
        <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
           <div className="flex justify-center">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
             </div>
           </div>
           <h1 className="text-xl font-black text-white uppercase tracking-tighter">Traiding<span className="text-indigo-500">A</span> GUARD</h1>
           <form onSubmit={handleLogin} className="space-y-3">
              <input 
                type="password" 
                placeholder="КЛЮЧ ДОСТУПА" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-800 uppercase tracking-widest text-xs"
              />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all">
                ВОЙТИ В ТЕРМИНАЛ
              </button>
           </form>
           <p className="text-[7px] font-black text-zinc-700 uppercase tracking-[0.3em]">RELIABLE TRADING INFRASTRUCTURE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-zinc-100 font-sans overflow-hidden">
      {/* ... (Sidebar и Mobile Nav остаются без изменений) */}
      <nav className="hidden md:flex w-14 border-r border-zinc-900 flex-col bg-black items-center py-4 space-y-4 shrink-0 z-50">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 cursor-pointer" onClick={() => setActiveView(AppView.DASHBOARD)}>
           <span className="text-[10px] font-black text-white">TA</span>
        </div>
        <div className="flex-1 flex flex-col space-y-3">
          <NavIcon active={activeView === AppView.DASHBOARD} onClick={() => setActiveView(AppView.DASHBOARD)} icon="📊" title="Дашборд" />
          <NavIcon active={activeView === AppView.JOURNAL} onClick={() => setActiveView(AppView.JOURNAL)} icon="📝" title="Журнал" />
          <NavIcon active={activeView === AppView.ANALYTICS} onClick={() => setActiveView(AppView.ANALYTICS)} icon="📈" title="Статистика" />
          <NavIcon active={activeView === AppView.CALENDAR} onClick={() => setActiveView(AppView.CALENDAR)} icon="📅" title="Календарь" />
          <NavIcon active={activeView === AppView.AI_CORE} onClick={() => setActiveView(AppView.AI_CORE)} icon="🧠" title="ИИ Центр" />
        </div>
        <NavIcon active={activeView === AppView.SETTINGS} onClick={() => setActiveView(AppView.SETTINGS)} icon="⚙️" title="Настройки" />
      </nav>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black/95 backdrop-blur-2xl border-t border-zinc-900 flex items-center justify-around px-4 z-[100] safe-area-bottom">
        <NavIcon active={activeView === AppView.DASHBOARD} onClick={() => setActiveView(AppView.DASHBOARD)} icon="📊" />
        <NavIcon active={activeView === AppView.JOURNAL} onClick={() => setActiveView(AppView.JOURNAL)} icon="📝" />
        <NavIcon active={activeView === AppView.ANALYTICS} onClick={() => setActiveView(AppView.ANALYTICS)} icon="📈" />
        <NavIcon active={activeView === AppView.AI_CORE} onClick={() => setActiveView(AppView.AI_CORE)} icon="🧠" />
        <NavIcon active={activeView === AppView.SETTINGS} onClick={() => setActiveView(AppView.SETTINGS)} icon="⚙️" />
      </nav>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        {/* ... (Header остается без изменений) */}
        <header className="h-10 border-b border-zinc-900 bg-black px-4 flex items-center justify-between shrink-0 z-40">
           <div className="flex items-center space-x-3">
              <h2 className="text-[10px] font-black text-white uppercase tracking-tighter">Traiding<span className="text-indigo-500">A</span></h2>
              <div className="h-3 w-px bg-zinc-800"></div>
              <div className="bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
                 <span className="text-[8px] font-bold text-zinc-100">{riskSettings.balance}{riskSettings.currency === 'USD' ? '$' : '₽'}</span>
              </div>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest hidden lg:block">ТЕРМИНАЛ TraidingA PRO</span>
              <button onClick={() => setIsAuth(false)} className="text-[8px] font-black text-zinc-700 hover:text-white transition-colors uppercase">Lock</button>
           </div>
        </header>

        {/* --- ОБНОВЛЕННАЯ РАЗМЕТКА С ПЕРЕДАЧЕЙ ДАННЫХ --- */}
        <div className="flex-1 overflow-hidden bg-[#020202] mb-[60px] md:mb-0 relative">
          {activeView === AppView.DASHBOARD && (
            <div className="h-full flex flex-col space-y-2 overflow-y-auto md:overflow-hidden p-2 sm:p-3 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
                 {/* ... (блок "Прибыль дня" без изменений) */}
                 <div className="h-[100px] sm:h-[120px] bg-zinc-900/30 border border-zinc-800 rounded-[1.8rem] p-4 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center">
                       <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">ПРИБЫЛЬ ДНЯ</span>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${dailyPnL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {dailyPnL >= 0 ? '+' : ''}{dailyPnL.toFixed(1)}$
                       </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                       <p className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none">${dailyPnL.toFixed(1)}</p>
                       <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${dailyPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(dailyPnL / (riskSettings.balance * 0.05)) * 100, 100)}%` }}></div>
                       </div>
                    </div>
                 </div>
                 <div className="h-[100px] sm:h-[120px]"><MarketStatus pulse={marketPulse} isConnected={isWsConnected} /></div>
                 <div className="h-[100px] sm:h-[120px]"><TradingSessions /></div>
                 <div className="h-[100px] sm:h-[120px]"><SessionControl /></div>
              </div>

              <div className="flex-1 grid grid-cols-12 gap-2 sm:gap-3 overflow-y-auto md:overflow-hidden min-h-0 pb-4 md:pb-0">
                 <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col space-y-2 sm:space-y-3 min-h-0">
                    <div className="shrink-0"><RiskCalculator settings={riskSettings} setSettings={setRiskSettings} dailyPnL={dailyPnL} /></div>
                    <div className="flex-1 min-h-[300px] lg:min-h-0"><NewsPanel events={economicCalendar} isConnected={isWsConnected} /></div>
                 </div>
                 <div className="col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col space-y-2 sm:space-y-3 min-h-0">
                    <div className="h-[200px] sm:h-[230px] shrink-0"><StatsDashboard trades={trades} /></div>
                    <div className="flex-1 min-h-[400px] lg:min-h-0 bg-zinc-900/10 rounded-[2rem] border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
                       <TradeJournal trades={trades} brokers={brokers} strategies={DEFAULT_STRATEGIES} onAddTrade={(t) => setTrades([t, ...trades])} onDeleteTrade={(id) => setTrades(trades.filter(x => x.id !== id))} onAddBroker={addBroker} compact />
                    </div>
                 </div>
                 <div className="col-span-12 xl:col-span-3 h-[480px] xl:h-full"><AICore ws={ws} /></div>
              </div>
            </div>
          )}

          {activeView !== AppView.DASHBOARD && (
            <div className="h-full overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-10 pb-[100px] md:pb-10">
              {activeView === AppView.JOURNAL && <TradeJournal trades={trades} brokers={brokers} strategies={DEFAULT_STRATEGIES} onAddTrade={(t) => setTrades([t, ...trades])} onDeleteTrade={(id) => setTrades(trades.filter(x => x.id !== id))} onAddBroker={addBroker} />}
              {activeView === AppView.ANALYTICS && <StatsDashboard trades={trades} extended />}
              {activeView === AppView.CALENDAR && <TraderCalendar trades={trades} />}
              {activeView === AppView.AI_CORE && <div className="h-full max-w-4xl mx-auto"><AICore ws={ws} /></div>}
              {activeView === AppView.SETTINGS && (
                 // ... (блок настроек остается без изменений)
                 <div className="max-w-2xl mx-auto p-5 sm:p-10 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-10">
                    <h2 className="text-xl font-black uppercase text-white tracking-widest flex items-center">
                       <span className="w-2 h-6 bg-indigo-500 mr-4 rounded-full"></span>
                       ТЕРМИНАЛ TraidingA PRO
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">БАЛАНС TraidingA</label>
                          <input type="number" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm text-white font-bold outline-none focus:border-indigo-500 transition-all" value={riskSettings.balance} onChange={e => setRiskSettings({...riskSettings, balance: Number(e.target.value)})} />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">ВАЛЮТА ОТЧЕТА</label>
                          <select className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm text-white font-bold outline-none cursor-pointer" value={riskSettings.currency} onChange={e => setRiskSettings({...riskSettings, currency: e.target.value as any})}>
                            <option value="USD">USD ($)</option>
                            <option value="RUB">RUB (₽)</option>
                          </select>
                       </div>
                    </div>
                    <div className="pt-8 border-t border-zinc-800">
                       <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4">БЭКАП ДАННЫХ</h3>
                       <div className="flex flex-col sm:flex-row gap-4">
                          <button onClick={exportData} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">
                            ЭКСПОРТ JSON
                          </button>
                          <label className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest text-center cursor-pointer transition-all border border-zinc-700">
                            ИМПОРТ BACKUP
                            <input type="file" accept=".json" onChange={importData} className="hidden" />
                          </label>
                       </div>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
        
        {/* НОВЫЙ КОМПОНЕНТ ДЛЯ ОПОВЕЩЕНИЙ */}
        <NewsAlert alert={newsAlert} onClose={() => setNewsAlert(null)} />
      </div>
    </div>
  );
};

// ... (компонент NavIcon остается без изменений)
const NavIcon: React.FC<{ active: boolean; onClick: () => void; icon: string; title?: string }> = ({ active, onClick, icon, title }) => (
  <button 
    onClick={onClick} 
    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 border relative group ${
      active ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-110 z-10' : 'text-zinc-700 border-transparent hover:text-zinc-400 hover:bg-zinc-900/50'
    }`}
  >
    <span className="text-xl">{icon}</span>
    {title && (
      <span className="hidden lg:group-hover:block absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-[8px] font-black uppercase rounded border border-zinc-700 whitespace-nowrap z-[1000]">
        {title}
      </span>
    )}
  </button>
);

export default App;
