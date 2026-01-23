
import React, { useState } from 'react';
import { RiskSettings } from '../types';

interface Props {
  settings: RiskSettings;
  setSettings: (s: RiskSettings) => void;
  dailyPnL?: number;
}

const RiskCalculator: React.FC<Props> = ({ settings, setSettings, dailyPnL = 0 }) => {
  const tradeAmount = Math.floor(settings.balance * (settings.riskPerTrade / 100));
  const dailyTarget = settings.balance * 0.05; // 5% goal
  const progressPercent = Math.min(Math.max((dailyPnL / dailyTarget) * 100, 0), 100);
  
  // Рассчитываем текущую просадку относительно баланса
  const currentDrawdown = dailyPnL < 0 ? (Math.abs(dailyPnL) / settings.balance) * 100 : 0;
  const drawdownProgress = Math.min((currentDrawdown / settings.maxDrawdownLimit) * 100, 100);

  const [checklist, setChecklist] = useState([
    { id: 1, text: 'ТРЕНД', done: false },
    { id: 2, text: 'УРОВНИ', done: false },
    { id: 3, text: 'НОВОСТИ', done: false },
    { id: 4, text: 'РИСК-М', done: false }
  ]);

  const toggleCheck = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2.5rem] flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
      
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">РИСК-ОПТИМИЗАТОР</h3>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-colors ${settings.riskPerTrade > 3 ? 'text-red-500 border-red-500/20' : 'text-indigo-400 border-indigo-500/20'}`}>
          {settings.riskPerTrade}%
        </span>
      </div>

      <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 flex justify-between items-end">
        <div>
           <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">ОБЪЕМ СДЕЛКИ</p>
           <p className="text-xl font-black text-white tracking-tighter leading-none">
             {settings.currency === 'USD' ? '$' : '₽'}{tradeAmount}
           </p>
        </div>
        <div className="text-right">
           <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">ПРОФИТ (+82%)</p>
           <p className="text-lg font-black text-emerald-500 tracking-tighter leading-none">
             +{settings.currency === 'USD' ? '$' : '₽'}{(tradeAmount * 0.82).toFixed(1)}
           </p>
        </div>
      </div>

      <div className="space-y-3">
         <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest">
               <span>ПРОГРЕСС К ЦЕЛИ (5%)</span>
               <span className="text-emerald-500">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progressPercent}%` }}></div>
            </div>
         </div>

         <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest">
               <span>РИСК ПРОСАДКИ ({settings.maxDrawdownLimit}%)</span>
               <span className={currentDrawdown > (settings.maxDrawdownLimit * 0.7) ? 'text-red-500' : 'text-zinc-600'}>{currentDrawdown.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-1000 ${currentDrawdown > (settings.maxDrawdownLimit * 0.7) ? 'bg-red-500' : 'bg-zinc-700'}`} style={{ width: `${drawdownProgress}%` }}></div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {checklist.map(item => (
          <div 
            key={item.id} 
            onClick={() => toggleCheck(item.id)}
            className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition-all active:scale-95 ${
              item.done ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-black/30 border-zinc-800 text-zinc-600'
            }`}
          >
            <div className={`w-3 h-3 rounded-md border flex items-center justify-center transition-colors ${item.done ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700'}`}>
               {item.done && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[8px] font-black uppercase">{item.text}</span>
          </div>
        ))}
      </div>
      
      <input 
        type="range" min="0.5" max="5" step="0.1" 
        value={settings.riskPerTrade} 
        onChange={e => setSettings({...settings, riskPerTrade: Number(e.target.value)})}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
      />
    </div>
  );
};

export default RiskCalculator;
