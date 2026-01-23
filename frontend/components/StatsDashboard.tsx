
import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Props {
  trades: Trade[];
  extended?: boolean;
}

const StatsDashboard: React.FC<Props> = ({ trades, extended = false }) => {
  const [chartType, setChartType] = useState<'EQUITY' | 'DRAWDOWN'>('EQUITY');

  const wins = trades.filter(t => t.result === 'WIN').length;
  const losses = trades.filter(t => t.result === 'LOSS').length;
  const winRate = trades.length > 0 ? (wins / trades.length * 100).toFixed(0) : 0;
  
  const totalPnL = trades.reduce((acc, t) => {
    return acc + (t.result === 'WIN' ? (t.amount * t.payout / 100) : -t.amount);
  }, 0);

  const profitFactor = useMemo(() => {
    const grossProfit = trades.filter(t => t.result === 'WIN').reduce((acc, t) => acc + (t.amount * t.payout / 100), 0);
    const grossLoss = trades.filter(t => t.result === 'LOSS').reduce((acc, t) => acc + t.amount, 0);
    return grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2);
  }, [trades]);

  const statsData = useMemo(() => {
    if (trades.length === 0) return { equity: [{ name: 0, value: 0 }], drawdown: [{ name: 0, value: 0 }], maxDD: 0 };
    
    let currentEquity = 0;
    let peak = 0;
    const equity: any[] = [];
    const drawdown: any[] = [];
    let maxDD = 0;

    [...trades].reverse().forEach((t, i) => {
      const profit = t.result === 'WIN' ? (t.amount * t.payout / 100) : -t.amount;
      currentEquity += profit;
      equity.push({ name: i + 1, value: Number(currentEquity.toFixed(1)) });
      
      if (currentEquity > peak) peak = currentEquity;
      const dd = peak === 0 ? 0 : ((peak - currentEquity) / Math.abs(peak || 1)) * 100;
      if (dd > maxDD) maxDD = dd;
      drawdown.push({ name: i + 1, value: Number(dd.toFixed(1)) });
    });

    return { equity, drawdown, maxDD };
  }, [trades]);

  const pieData = [
    { name: 'WIN', value: wins || 1, color: '#10b981' },
    { name: 'LOSS', value: losses || 0, color: '#ef4444' }
  ];

  return (
    <div className={`h-full flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl`}>
      <div className="p-3 sm:p-4 flex justify-between items-center bg-zinc-900/60 border-b border-zinc-900 shrink-0">
        <div className="flex space-x-3 sm:space-x-4">
           <button onClick={() => setChartType('EQUITY')} className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${chartType === 'EQUITY' ? 'text-indigo-500 underline underline-offset-4' : 'text-zinc-600 hover:text-zinc-400'}`}>ЭКВИТИ</button>
           <button onClick={() => setChartType('DRAWDOWN')} className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${chartType === 'DRAWDOWN' ? 'text-red-500 underline underline-offset-4' : 'text-zinc-600 hover:text-zinc-400'}`}>ПРОСАДКА</button>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
           <div className="hidden xs:flex flex-col items-end">
              <span className="text-[6px] sm:text-[7px] font-black text-zinc-600 uppercase">P-FACTOR</span>
              <span className="text-[10px] sm:text-[11px] font-black text-white">{profitFactor}</span>
           </div>
           <div className={`text-[10px] sm:text-[11px] font-black px-2 sm:px-3 py-1 rounded-lg ${totalPnL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
             {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(1)}$
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
        <div className="flex-1 sm:w-2/3 p-3 min-h-[120px]">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartType === 'EQUITY' ? statsData.equity : statsData.drawdown}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartType === 'EQUITY' ? '#6366f1' : '#ef4444'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartType === 'EQUITY' ? '#6366f1' : '#ef4444'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', fontSize: '9px', borderRadius: '10px' }}
                  itemStyle={{ color: chartType === 'EQUITY' ? '#6366f1' : '#ef4444' }}
                />
                <Area type="monotone" dataKey="value" stroke={chartType === 'EQUITY' ? '#6366f1' : '#ef4444'} fill="url(#chartGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
           </ResponsiveContainer>
        </div>

        <div className="w-full sm:w-1/3 border-t sm:border-t-0 sm:border-l border-zinc-800/50 flex flex-row sm:flex-col justify-around items-center p-3 sm:p-4 bg-black/10">
           <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius="70%" outerRadius="100%" paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xs sm:text-base font-black text-white">{winRate}%</span>
                 <span className="text-[6px] sm:text-[7px] font-black text-zinc-600 uppercase">WIN</span>
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row sm:gap-4 text-center">
              <div className="flex flex-col mb-2 sm:mb-0">
                <span className="text-[6px] sm:text-[7px] font-black text-zinc-600 uppercase tracking-widest">MAX DD</span>
                <span className="text-[10px] sm:text-[11px] font-black text-red-500">{statsData.maxDD.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[6px] sm:text-[7px] font-black text-zinc-600 uppercase tracking-widest">TRADES</span>
                <span className="text-[10px] sm:text-[11px] font-black text-white">{trades.length}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
