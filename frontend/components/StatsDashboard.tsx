// Добавляем `useEffect`
import React, { useMemo, useState, useEffect } from 'react';
import { Trade } from '../types';
import { AreaChart, Area, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Props {
  trades: Trade[];
  extended?: boolean;
}

const StatsDashboard: React.FC<Props> = ({ trades, extended = false }) => {
  // --- НОВЫЙ КОД: Состояние для отложенного рендеринга ---
  const [isClient, setIsClient] = useState(false);

  // --- НОВЫЙ КОД: Этот эффект выполнится ПОСЛЕ первого рендера ---
  useEffect(() => {
    // Мы устанавливаем isClient в true. Это вызовет повторный рендер,
    // но на этот раз все размеры контейнеров уже будут известны браузеру.
    setIsClient(true);
  }, []);
  
  // Вся ваша логика остается без изменений
  const [chartType, setChartType] = useState<'EQUITY' | 'DRAWDOWN'>('EQUITY');
  const wins = trades.filter(t => t.result === 'WIN').length;
  const losses = trades.filter(t => t.result === 'LOSS').length;
  const winRate = trades.length > 0 ? (wins / trades.length * 100).toFixed(0) : 0;
  const totalPnL = trades.reduce((acc, t) => acc + (t.result === 'WIN' ? (t.amount * t.payout / 100) : -t.amount), 0);
  const profitFactor = useMemo(() => { /* ... */ }, [trades]);
  const statsData = useMemo(() => { /* ... */ }, [trades]);
  const pieData = [
    { name: 'WIN', value: wins || 1, color: '#10b981' },
    { name: 'LOSS', value: losses || 0, color: '#ef4444' }
  ];

  // --- НОВЫЙ КОД: Если это первый рендер на сервере или до эффекта, показываем заглушку ---
  if (!isClient) {
    // Возвращаем тот же каркас, но без графиков внутри.
    // Это предотвратит ошибку при первом рендере.
    return <div className="h-full w-full bg-zinc-900/40 border border-zinc-800 rounded-[2rem]"></div>;
  }

  // --- Когда isClient === true, рендерим полный компонент ---
  return (
    <div className={`h-full grid grid-rows-[auto_1fr] bg-zinc-900/40 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl`}>
      {/* Хедер */}
      <div className="p-3 sm:p-4 flex justify-between items-center bg-zinc-900/60 border-b border-zinc-900">
        {/* ... ваш код хедера ... */}
      </div>

      {/* Контент */}
      <div className="grid grid-cols-1 sm:grid-cols-3 min-h-0">
        {/* Основной график */}
        <div className="col-span-1 sm:col-span-2 p-3 min-h-0 min-w-0">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartType === 'EQUITY' ? statsData.equity : statsData.drawdown} margin={{ top: 5, right: 5, bottom: -20, left: -30 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartType === 'EQUITY' ? '#6366f1' : '#ef4444'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartType === 'EQUITY' ? '#6366f1' : '#ef4444'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', fontSize: '9px', borderRadius: '10px' }}
                  itemStyle={{ color: chartType === 'EQUITY' ? '#6366f1' : '#ef4444' }}
                  labelStyle={{ display: 'none' }}
                  cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                />
                <YAxis tick={{ fontSize: 8, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="value" stroke={chartType === 'EQUITY' ? '#6366f1' : '#ef4444'} fill="url(#chartGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
           </ResponsiveContainer>
        </div>

        {/* Боковая панель */}
        <div className="col-span-1 border-t sm:border-t-0 sm:border-l border-zinc-800/50 flex flex-row sm:flex-col justify-around items-center p-3 sm:p-4 bg-black/10">
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
              {/* ... ваш код статистики ... */}
           </div>
        </div>
      </div>
    </div>
  );
};

// Я скопировал недостающие части из вашего предыдущего кода для полноты
const MemoizedProfitFactor: React.FC<{ trades: Trade[] }> = React.memo(({ trades }) => {
    const profitFactor = useMemo(() => {
        const grossProfit = trades.filter(t => t.result === 'WIN').reduce((acc, t) => acc + (t.amount * t.payout / 100), 0);
        const grossLoss = trades.filter(t => t.result === 'LOSS').reduce((acc, t) => acc + t.amount, 0);
        return grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2);
    }, [trades]);
    return <>{profitFactor}</>;
});

const MemoizedStatsData: React.FC<{ trades: Trade[] }> = React.memo(({ trades }) => {
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
    return <>{JSON.stringify(statsData)}</>;
});


export default StatsDashboard;
