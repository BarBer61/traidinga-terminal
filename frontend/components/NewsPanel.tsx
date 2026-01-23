import React, { useState, useEffect } from 'react';

// Предполагается, что тип NewsItem приходит из ../types
interface NewsItem {
  id: string;
  time: string;
  event: string;
  currency: string;
  impact: 'high' | 'medium' | 'low' | string;
}

interface NewsPanelProps {
  events: NewsItem[];
  isConnected: boolean;
}

const NewsPanel: React.FC<NewsPanelProps> = ({ events, isConnected }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (eventTime: string) => {
    const msLeft = new Date(eventTime).getTime() - currentTime;
    if (msLeft <= 0) return "ВЫШЛО";
    const totalSeconds = Math.floor(msLeft / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] h-full flex flex-col relative overflow-hidden shadow-xl">
      <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0 z-10">
        <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500">ЭКОНОМИЧЕСКИЙ КАЛЕНДАРЬ</h3>
        <div className="flex items-center space-x-1.5 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
           <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span className={`text-[6px] sm:text-[7px] font-black uppercase ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
             {isConnected ? 'LIVE' : 'OFFLINE'}
           </span>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-0.5 z-10 min-h-0">
        {events.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-20">
            <span className="text-[8px] font-black uppercase tracking-widest text-center">
              {isConnected ? 'ОЖИДАНИЕ ДАННЫХ...' : 'НЕТ ПОДКЛЮЧЕНИЯ К СЕРВЕРУ'}
            </span>
          </div>
        )}
        {sortedEvents.map(item => {
          const msLeft = new Date(item.time).getTime() - currentTime;
          const isReleased = msLeft <= 0;
          const isImminent = msLeft > 0 && msLeft < 600000;
          const isHigh = item.impact === 'high';
          const isMedium = item.impact === 'medium';
          
          return (
            <div 
              key={item.id} 
              className={`group p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/40 border transition-all duration-300 flex items-center justify-between min-w-0 ${
                isImminent && isHigh
                  ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-500/10' 
                  : isImminent && isMedium ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden flex-1 min-w-0">
                <div className={`w-1 h-5 sm:h-6 rounded-full shrink-0 ${isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-zinc-600'}`}></div>
                <div className="truncate flex-1">
                  <h4 className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-tight truncate">
                    {item.event}
                  </h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[6px] sm:text-[7px] font-black text-zinc-600 uppercase tracking-widest">{item.currency}</span>
                    <span className={`text-[6px] sm:text-[7px] font-black uppercase ${isHigh ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {isHigh ? 'ВЫСОКАЯ' : isMedium ? 'СРЕДНЯЯ' : 'НИЗКАЯ'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0 ml-2">
                <div className={`font-mono text-[9px] sm:text-[10px] font-black tabular-nums ${isReleased ? 'text-emerald-500' : isImminent ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                  {formatCountdown(item.time)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewsPanel;
