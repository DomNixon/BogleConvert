import React from 'react';
import { StockPosition } from '../types';
import { CURRENCY_FORMATTER, PERCENT_FORMATTER } from '../constants';

interface DeepDivePanelProps {
  stock: StockPosition | null;
  onClose: () => void;
  onViewReport: (ticker: string) => void;
}

const DeepDivePanel: React.FC<DeepDivePanelProps> = ({ stock, onClose, onViewReport }) => {
  if (!stock) return null;

  const isPositive = stock.nominalReturn >= 0;
  
  // Calculate Totals
  const totalValue = stock.shares * stock.currentPrice;
  const totalGain = (stock.currentPrice - stock.avgCost) * stock.shares;

  return (
    <aside className="w-full lg:w-[380px] flex-shrink-0 bg-surface border border-outline lg:rounded-xl p-6 flex flex-col gap-6 h-fit animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display tracking-tight text-white">Ticker Deep Dive</h2>
        <button onClick={onClose} className="text-muted hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-2">
            <p className="text-lg font-bold text-white">{stock.ticker.toUpperCase()}</p>
            <p className="text-sm text-muted">{stock.name}</p>
        </div>
        
        <div className="flex items-baseline gap-3">
             <p className={`text-3xl font-black font-display ${isPositive ? 'text-positive' : 'text-negative'}`}>
              {CURRENCY_FORMATTER.format(stock.currentPrice)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-positive' : 'text-negative'} font-medium flex items-center gap-1`}>
                 <span className="material-symbols-outlined text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
                 {PERCENT_FORMATTER.format(Math.abs(stock.nominalReturn) / 100)} Nominal
            </p>
        </div>
        
        {stock.lastUpdated && (
            <p className="text-xs text-muted mt-1">Data as of: {stock.lastUpdated}</p>
        )}
      </div>

      <div className="bg-bg-dark border border-outline rounded-lg p-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-primary/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <p className="text-sm font-medium text-muted relative z-10">Averaged Reality</p>
        <p className="text-4xl font-bold font-display text-white mt-2 relative z-10">
          {stock.inflationAdjReturn > 0 ? '+' : ''}{PERCENT_FORMATTER.format(stock.inflationAdjReturn / 100)}
        </p>
        <p className={`text-base text-transparent bg-clip-text bg-gradient-to-r font-medium relative z-10 ${stock.inflationAdjReturn >= 0 ? 'from-secondary to-cyan-300' : 'from-primary to-purple-400'}`}>
          Real Annual Growth
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Performance Summary</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {stock.name} ({stock.ticker.toUpperCase()}) has shown {stock.nominalReturn > 10 ? 'strong' : 'moderate'} nominal returns.
          Its inflation-adjusted growth remains {stock.inflationAdjReturn > 0 ? 'robust' : 'lagging'}, indicating {stock.inflationAdjReturn > 0 ? 'a substantial increase' : 'a potential decrease'} in real purchasing power for the long-term holder.
          The asset is currently classified as <span className="text-white font-medium">'{stock.status}'</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline">
        <div>
            <p className="text-muted text-sm">Total Value</p>
            <p className="text-white font-bold text-lg">{CURRENCY_FORMATTER.format(totalValue)}</p>
        </div>
        <div>
            <p className="text-muted text-sm">Total Gain</p>
            <div className={`flex items-baseline gap-2 ${totalGain >= 0 ? 'text-positive' : 'text-negative'}`}>
                <span className="font-bold text-lg">{totalGain >= 0 ? '+' : ''}{CURRENCY_FORMATTER.format(totalGain)}</span>
                <span className="text-xs font-medium">({PERCENT_FORMATTER.format(stock.nominalReturn / 100)})</span>
            </div>
        </div>
      </div>
      
      <div className="space-y-2 pt-4 border-t border-outline">
          <div className="flex justify-between text-sm">
              <span className="text-muted">Sector</span>
              <span className="text-white">{stock.sector}</span>
          </div>
           <div className="flex justify-between text-sm">
              <span className="text-muted">CAGR</span>
              <span className={`font-medium ${stock.cagr > 0 ? 'text-secondary' : 'text-primary'}`}>{PERCENT_FORMATTER.format(stock.cagr / 100)}</span>
          </div>
           <div className="flex justify-between text-sm">
              <span className="text-muted">Positions</span>
              <span className="text-white">{stock.shares} shares</span>
          </div>
      </div>
      
       <button 
        onClick={() => onViewReport(stock.ticker)}
        className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium border border-outline transition-colors text-sm flex items-center justify-center gap-2"
       >
            <span className="material-symbols-outlined text-base">description</span>
            Stock Report
       </button>
    </aside>
  );
};

export default DeepDivePanel;