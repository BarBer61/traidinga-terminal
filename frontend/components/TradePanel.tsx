// frontend/components/TradePanel.tsx

import React from 'react';

const TradePanel: React.FC = () => {
  return (
    <div className="h-full bg-zinc-900/40 border border-zinc-800 rounded-[2rem] shadow-2xl p-4">
      <h2 className="text-sm font-bold text-white mb-4">Панель сделок</h2>
      {/* Здесь будет логика для открытия сделок */}
      <p className="text-zinc-500 text-xs">Скоро...</p>
    </div>
  );
};

export default TradePanel;
