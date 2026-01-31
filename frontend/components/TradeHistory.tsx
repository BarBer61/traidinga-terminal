// frontend/components/TradeHistory.tsx

import React from 'react';
import { Trade } from '../types';

interface Props {
  trades: Trade[];
}

const TradeHistory: React.FC<Props> = ({ trades }) => {
  return (
    <div className="h-full flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden">
      <h2 className="text-sm font-bold text-white p-4 flex-shrink-0">История сделок</h2>
      <div className="flex-grow overflow-y-auto px-4 pb-4">
        {trades.length === 0 ? (
          <p className="text-zinc-500 text-xs text-center mt-4">Сделок пока нет.</p>
        ) : (
          <ul className="space-y-2">
            {trades.map((trade) => (
              <li key={trade.id} className={`flex justify-between items-center p-2 rounded-lg text-xs ${trade.result === 'WIN' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <span className="font-bold">{trade.asset}</span>
                <span className={trade.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}>
                  {trade.result === 'WIN' ? `+${(trade.amount * trade.payout / 100).toFixed(2)}` : `-${trade.amount.toFixed(2)}`}$
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TradeHistory;
