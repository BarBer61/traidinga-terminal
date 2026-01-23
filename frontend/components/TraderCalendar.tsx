
import React from 'react';
import { Trade } from '../types';

interface Props {
  trades: Trade[];
}

const TraderCalendar: React.FC<Props> = ({ trades }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const today = now.getDate();

  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(now);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Смещение для начала недели с Понедельника
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getDayStats = (day: number) => {
    const dayTrades = trades.filter(t => {
      const d = new Date(t.entryTime);
      return d.getDate() === day && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear;
    });

    if (dayTrades.length === 0) return { result: 'neutral', sum: 0 };
    
    const pnl = dayTrades.reduce((acc, t) => {
      return acc + (t.result === 'WIN' ? (t.amount * t.payout / 100) : -t.amount);
    }, 0);

    return { result: pnl >= 0 ? 'win' : 'loss', sum: pnl };
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: offset }, (_, i) => i);

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-10 rounded-[3rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
            {monthName} <span className="text-zinc-700">{currentYear}</span>
          </h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Торговая активность</p>
        </div>
        <div className="flex space-x-3 text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-500">ПРИБЫЛЬ</div>
          <div className="flex items-center bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full text-red-500">УБЫТОК</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-zinc-600 pb-4">{d}</div>
        ))}
        
        {emptySlots.map(slot => (
          <div key={`empty-${slot}`} className="aspect-square opacity-0"></div>
        ))}

        {days.map(day => {
          const stats = getDayStats(day);
          const isToday = day === today;
          
          return (
            <div 
              key={day} 
              className={`aspect-square rounded-2xl md:rounded-3xl border flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                isToday ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-black z-10' : ''
              } ${
                stats.result === 'win' ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 
                stats.result === 'loss' ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 
                'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700'
              }`}
            >
              <span className={`text-xs md:text-lg font-black ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>
                {day}
              </span>
              
              {stats.sum !== 0 && (
                <span className={`text-[8px] md:text-[10px] font-black mt-1 ${stats.result === 'win' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.sum > 0 ? `+$${stats.sum.toFixed(0)}` : `-$${Math.abs(stats.sum).toFixed(0)}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TraderCalendar;
