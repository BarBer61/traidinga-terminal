import React from 'react';

interface MarketPulse {
  state: 'СТАБИЛЬНО' | 'УМЕРЕННО' | 'ИМПУЛЬСИВНО' | 'ХАОТИЧНО';
  impulse: number;
  description: string;
}

interface MarketStatusProps {
  pulse: MarketPulse;
  isConnected: boolean;
}

const MarketStatus: React.FC<MarketStatusProps> = ({ pulse, isConnected }) => {
  const { state, impulse, description } = pulse;

  const config = {
    СТАБИЛЬНО: { color: 'text-emerald-500', bg: 'bg-emerald-500' },
    УМЕРЕННО: { color: 'text-amber-500', bg: 'bg-amber-500' },
    ИМПУЛЬСИВНО: { color: 'text-indigo-500', bg: 'bg-indigo-500' },
    ХАОТИЧНО: { color: 'text-red-500', bg: 'bg-red-500' }
  };

  const current = config[state] || config['СТАБИЛЬНО'];

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 h-full rounded-[2rem] p-4 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex justify-between items-center z-10">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">ПУЛЬС РЫНКА</span>
        <div className="flex items-center space-x-1.5 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
           <div className={`w-1 h-1 rounded-full ${isConnected ? current.bg : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
           <span className={`text-[7px] font-black uppercase ${isConnected ? current.color : 'text-red-500'}`}>
             {isConnected ? 'LIVE' : 'OFFLINE'}
           </span>
        </div>
      </div>

      <div className="flex-1 flex items-center space-x-4 z-10">
         <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className={`absolute w-full h-full ${current.color} opacity-20`} viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
               <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" className="animate-[spin_10s_linear_infinite]" />
            </svg>
            <div className={`w-3 h-3 rounded-full ${current.bg} shadow-[0_0_15px_currentColor] animate-pulse`}></div>
         </div>
         <div className="overflow-hidden">
            <h4 className={`text-sm font-black tracking-widest uppercase ${current.color} truncate`}>{state}</h4>
            <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-0.5 truncate">{description}</p>
         </div>
      </div>

      <div className="z-10 flex justify-between items-end">
         <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-500 uppercase">ИМПУЛЬС</span>
            <span className={`text-lg font-black tracking-tighter ${current.color}`}>{impulse}%</span>
         </div>
         <div className="w-20 h-4 flex items-end space-x-0.5">
            {[...Array(10)].map((_, i) => (
               <div 
                 key={i} 
                 className={`w-1 rounded-t-full ${current.bg} transition-all duration-500`} 
                 style={{ 
                    height: `${(Math.random() * (impulse/2) + (impulse/2))}%`,
                    opacity: 0.3 + (i * 0.07)
                 }}
               ></div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default MarketStatus;
