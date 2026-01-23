
import React, { useState, useEffect } from 'react';

const SESSIONS = [
  { name: 'ТОКИО', start: 3, end: 12, color: 'text-indigo-400', bg: 'bg-indigo-400' },
  { name: 'ЛОНДОН', start: 11, end: 20, color: 'text-emerald-400', bg: 'bg-emerald-400' },
  { name: 'НЬЮ-ЙОРК', start: 16, end: 1, color: 'text-amber-400', bg: 'bg-amber-400' }
];

const TradingSessions: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // MSK is UTC+3
  const mskDate = new Date(time.getTime() + (time.getTimezoneOffset() + 180) * 60000);
  const mskHour = mskDate.getHours();
  const mskTimeStr = mskDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const getSessionStatus = (start: number, end: number) => {
    if (start < end) return mskHour >= start && mskHour < end;
    return mskHour >= start || mskHour < end;
  };

  const activeSessionsCount = SESSIONS.filter(s => getSessionStatus(s.start, s.end)).length;

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 h-full rounded-[2rem] p-4 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex justify-between items-center z-10">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">СЕССИИ (МСК)</span>
        <div className="flex items-center space-x-1.5 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
           <span className="text-[7px] font-black text-zinc-600 uppercase">UTC+3</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center z-10">
         <h2 className="text-2xl font-black text-white tracking-tighter font-mono">{mskTimeStr}</h2>
         <p className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1">ТЕКУЩЕЕ ВРЕМЯ TraidingA</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 z-10">
        {SESSIONS.map(s => {
          const active = getSessionStatus(s.start, s.end);
          return (
            <div key={s.name} className="flex flex-col space-y-1">
               <div className={`h-1 w-full rounded-full transition-all duration-1000 ${active ? s.bg + ' shadow-[0_0_8px_currentColor]' : 'bg-zinc-800'}`}></div>
               <span className={`text-[7px] font-black text-center ${active ? s.color : 'text-zinc-700'} uppercase transition-colors`}>{s.name}</span>
            </div>
          );
        })}
      </div>
      
      {activeSessionsCount > 1 && (
         <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
      )}
    </div>
  );
};

export default TradingSessions;
