
import React, { useState, useEffect } from 'react';
import { Trade, Broker, Strategy } from '../types';
import { TIMEFRAMES } from '../constants';

interface Props {
  trades: Trade[];
  brokers: Broker[];
  strategies: Strategy[];
  onAddTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onAddBroker: (name: string) => void;
  compact?: boolean;
}

const TradeJournal: React.FC<Props> = ({ trades, brokers, strategies, onAddTrade, onDeleteTrade, onAddBroker, compact = false }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    asset: 'EUR/USD',
    direction: 'CALL' as 'CALL' | 'PUT',
    timeframe: '5m',
    payout: 82,
    amount: 10,
    brokerId: '',
    strategyId: '1',
    confidence: 3,
    mood: 'Спокойствие' as any,
    result: 'WIN' as 'WIN' | 'LOSS' | 'REFUND',
    comment: ''
  });

  useEffect(() => {
    if (brokers.length > 0 && !formData.brokerId) {
      setFormData(prev => ({ ...prev, brokerId: brokers[0].id }));
    }
  }, [brokers, isFormOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brokerId) {
      alert("ВЫБЕРИТЕ БРОКЕРА");
      return;
    }
    const trade: Trade = {
      id: Date.now().toString(),
      entryTime: new Date().toISOString(),
      exitTime: new Date().toISOString(),
      asset: formData.asset.toUpperCase().trim(),
      direction: formData.direction,
      timeframe: formData.timeframe,
      payout: formData.payout,
      amount: formData.amount,
      brokerId: formData.brokerId,
      strategyId: formData.strategyId,
      confidence: formData.confidence,
      mood: formData.mood,
      result: formData.result,
      comment: formData.comment
    };
    onAddTrade(trade);
    setIsFormOpen(false);
  };

  const getBrokerName = (id: string) => brokers.find(b => b.id === id)?.name || 'UNKNOWN';

  return (
    <div className={`flex flex-col h-full overflow-hidden ${compact ? 'bg-transparent' : 'space-y-4'}`}>
      <div className={`flex justify-between items-center shrink-0 ${compact ? 'p-3 sm:p-4 bg-zinc-900/50 border-b border-zinc-900' : 'px-2'}`}>
        <div className="min-w-0 flex-1 pr-2">
          <h2 className={`${compact ? 'text-[9px] sm:text-[11px]' : 'text-xl'} font-black uppercase tracking-tighter truncate`}>ЖУРНАЛ СДЕЛОК</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)} 
          className={`${compact ? 'px-2 py-1.5 text-[7px] sm:text-[8px]' : 'px-6 py-3 text-[10px]'} bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl font-black uppercase transition-all shadow-xl whitespace-nowrap`}
        >
          {compact ? '+ ДОБАВИТЬ' : '+ ФИКСИРОВАТЬ'}
        </button>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-[700px]">
          <thead className="bg-black/80 backdrop-blur-md sticky top-0 z-20 text-[7px] sm:text-[8px] font-black uppercase text-zinc-600 border-b border-zinc-900">
            <tr>
              <th className="p-3 sm:p-4">ВРЕМЯ</th>
              <th className="p-3 sm:p-4">ИНСТРУМЕНТ</th>
              <th className="p-3 sm:p-4">ТИП</th>
              <th className="p-3 sm:p-4 text-center">РИСК</th>
              <th className="p-3 sm:p-4 text-right">СУММА</th>
              <th className="p-3 sm:p-4 text-right">ИТОГ</th>
              <th className="p-3 sm:p-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {trades.length === 0 ? (
              <tr><td colSpan={7} className="p-20 text-center text-[10px] font-black text-zinc-800 uppercase tracking-widest">ЖУРНАЛ ПУСТ</td></tr>
            ) : (
              trades.slice(0, compact ? 25 : undefined).map(trade => (
                <tr key={trade.id} className="hover:bg-zinc-900/30 transition-all group">
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <span className="text-[6px] font-black text-indigo-500 uppercase mb-0.5">{getBrokerName(trade.brokerId)}</span>
                      <span className="text-white text-[10px] sm:text-[11px] font-bold">{new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center space-x-2">
                       <span className="font-black text-white text-[10px] sm:text-[11px]">{trade.asset}</span>
                       <span className="text-[6px] font-black text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded uppercase">{trade.timeframe}</span>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase border ${trade.direction === 'CALL' ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20' : 'text-red-500 bg-red-500/5 border-red-500/20'}`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-center">
                    <div className="flex justify-center space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1 h-2 rounded-full ${i < trade.confidence ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-bold text-zinc-400 text-right">${trade.amount}</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className={`font-black text-[10px] sm:text-[11px] ${trade.result === 'WIN' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {trade.result === 'WIN' ? `+$${(trade.amount * trade.payout / 100).toFixed(1)}` : `-$${trade.amount}`}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <button onClick={() => onDeleteTrade(trade.id)} className="text-zinc-800 hover:text-red-500 transition-colors p-1 group-hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/98 backdrop-blur-xl overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] w-full max-w-xl space-y-6 sm:space-y-8 shadow-2xl animate-in zoom-in-95 my-auto">
            <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tighter">ФИКСАЦИЯ СДЕЛКИ</h3>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">БРОКЕР</label>
                <select className="w-full bg-black border border-zinc-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-[12px] text-white font-bold outline-none" value={formData.brokerId} onChange={e => setFormData({...formData, brokerId: e.target.value})}>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase">ИНСТРУМЕНТ</label>
                <input className="w-full bg-black border border-zinc-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-[12px] text-white uppercase font-bold outline-none" value={formData.asset} onChange={e => setFormData({...formData, asset: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase">ВЫПЛАТА %</label>
                <input type="number" className="w-full bg-black border border-zinc-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-[12px] text-white font-bold outline-none" value={formData.payout} onChange={e => setFormData({...formData, payout: Number(e.target.value)})} />
              </div>
              
              <div className="col-span-2 flex space-x-2 sm:space-x-3">
                <button type="button" onClick={() => setFormData({...formData, result: 'WIN'})} className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black border transition-all ${formData.result === 'WIN' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-black border-zinc-800 text-zinc-600'}`}>PROFIT</button>
                <button type="button" onClick={() => setFormData({...formData, result: 'LOSS'})} className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black border transition-all ${formData.result === 'LOSS' ? 'bg-red-600 border-red-500 text-white' : 'bg-black border-zinc-800 text-zinc-600'}`}>LOSS</button>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">РИСК (1-5)</label>
                <div className="flex justify-between items-center bg-black p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setFormData({...formData, confidence: v})} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg font-black text-[9px] transition-all ${formData.confidence === v ? 'bg-indigo-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>{v}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">СОСТОЯНИЕ</label>
                <select className="w-full bg-black border border-zinc-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-[10px] text-white font-black outline-none" value={formData.mood} onChange={e => setFormData({...formData, mood: e.target.value as any})}>
                  <option value="Спокойствие">СПОКОЙСТВИЕ</option>
                  <option value="Тильт">ТИЛЬТ</option>
                  <option value="Страх">СТРАХ</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 sm:space-x-4 pt-4 sm:pt-6">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 sm:py-4 text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">ОТМЕНА</button>
              <button type="submit" className="flex-[2] bg-indigo-600 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black text-white uppercase tracking-widest shadow-2xl active:scale-95 transition-all">СОХРАНИТЬ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TradeJournal;
