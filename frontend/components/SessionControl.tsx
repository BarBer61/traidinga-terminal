
import React, { useState, useEffect } from 'react';

const SessionControl: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const pad = (num: number) => num.toString().padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  // Определение уровня усталости для контроля бдительности
  const getAlertLevel = () => {
    if (seconds > 5400) return { label: 'КРИТИЧЕСКАЯ УСТАЛОСТЬ', color: 'text-red-500', bg: 'bg-red-500' };
    if (seconds > 2700) return { label: 'СНИЖЕНИЕ ФОКУСА', color: 'text-amber-500', bg: 'bg-amber-500' };
    return { label: 'БДИТЕЛЬНОСТЬ В НОРМЕ', color: 'text-emerald-500', bg: 'bg-emerald-500' };
  };

  const alert = getAlertLevel();

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 h-full rounded-[2rem] p-4 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Header Info */}
      <div className="flex justify-between items-center z-10">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">ФОКУС ТАЙМЕР</span>
        <div className="flex items-center space-x-1.5 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
           <div className={`w-1 h-1 rounded-full ${isActive ? alert.bg : 'bg-zinc-700'} ${isActive ? 'animate-pulse' : ''}`}></div>
           <span className={`text-[7px] font-black ${isActive ? alert.color : 'text-zinc-600'} uppercase`}>
             {isActive ? 'АКТИВЕН' : 'ПАУЗА'}
           </span>
        </div>
      </div>

      {/* Timer Value */}
      <div className="flex-1 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-black text-white tracking-tighter">{pad(h)}</span>
            <span className="text-[10px] font-black text-zinc-700">:</span>
            <span className="text-2xl font-black text-white tracking-tighter">{pad(m)}</span>
            <span className="text-[10px] font-black text-zinc-700">:</span>
            <span className={`text-2xl font-black tracking-tighter ${isActive ? 'text-indigo-500' : 'text-zinc-500'}`}>{pad(s)}</span>
          </div>
          <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${isActive ? alert.color : 'text-zinc-700'}`}>
            {alert.label}
          </span>
        </div>

        {/* Control Button */}
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
            isActive 
              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
              : 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95'
          }`}
        >
          {isActive ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          ) : (
            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </div>

      {/* Footer Visual Decor */}
      <div className="flex items-center space-x-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
         <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${alert.bg}`} 
              style={{ width: `${Math.min((seconds / 5400) * 100, 100)}%` }}
            ></div>
         </div>
         <span className="text-[6px] font-black text-zinc-600 uppercase">LIMIT 90M</span>
      </div>

      {/* Background Graphic */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
    </div>
  );
};

export default SessionControl;
