/*
 * Copyright (c) 2026 Mid Michigan Connections LLC.
 * This file is part of BogleConvert.
 *
 * BogleConvert is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * BogleConvert is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with BogleConvert. If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import { StockPosition } from '../types';
import { PERCENT_FORMATTER } from '../constants';

interface PortfolioAnalysisProps {
  portfolio: StockPosition[];
  onSelectStock: (ticker: string) => void;
}

const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ portfolio, onSelectStock }) => {
  // Sort portfolio by weight descending initially
  const sortedByWeight = [...portfolio].sort((a, b) => b.weight - a.weight);

  let gridItems: StockPosition[] = [];

  // Data Preparation Logic:
  if (sortedByWeight.length <= 11) {
    gridItems = sortedByWeight;
  } else {
    const top10 = sortedByWeight.slice(0, 10);
    const others = sortedByWeight.slice(10);
    const othersWeight = others.reduce((acc, curr) => acc + curr.weight, 0);

    const othersItem: StockPosition = {
      ticker: `Others (${others.length})`,
      name: 'Rest of Portfolio',
      weight: Number(othersWeight.toFixed(1)),
      sector: 'Mixed',
      avgCost: 0,
      currentPrice: 0,
      shares: 0,
      yearsHeld: 0,
      nominalReturn: 0,
      inflationAdjReturn: 0,
      status: 'Tracking Market',
      cagr: 0
    };

    gridItems = [...top10, othersItem].sort((a, b) => b.weight - a.weight);
  }

  const totalItems = gridItems.length;

  // Adaptive Grid Logic for 4x4 Grid (16 cells)
  // Returns layout classes only. Color is handled dynamically based on status.
  const getGridClasses = (index: number, total: number) => {
    // 1 Item: Full Fill
    if (total === 1) return "col-span-4 row-span-4 text-3xl";

    // 2 Items: Split Vertical
    if (total === 2) {
      return index === 0 ? "col-span-2 row-span-4 text-2xl" : "col-span-2 row-span-4 text-2xl";
    }

    // 3 Items: Left Half (Big), Right Half (Split Horizontal)
    if (total === 3) {
      if (index === 0) return "col-span-2 row-span-4 text-2xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      return "col-span-2 row-span-2 text-xl";
    }

    // 4 Items: 2x2 Grid
    if (total === 4) {
      return "col-span-2 row-span-2 text-xl";
    }

    // 5 Items: 
    if (total === 5) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      if (index === 2) return "col-span-4 row-span-1 text-lg";
      return "col-span-2 row-span-1 text-lg";
    }

    // 6 Items: 
    if (total === 6) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      return "col-span-2 row-span-1 text-lg";
    }

    // 7 Items: 
    if (total === 7) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      if (index <= 4) return "col-span-2 row-span-1 text-lg";
      return "col-span-1 row-span-1 text-base";
    }

    // 8 Items: 
    if (total === 8) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      if (index === 2 || index === 3) return "col-span-2 row-span-1 text-lg";
      return "col-span-1 row-span-1 text-base";
    }

    // 9 Items: 
    if (total === 9) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      if (index === 2) return "col-span-2 row-span-1 text-lg";
      return "col-span-1 row-span-1 text-base";
    }

    // 10 Items: 
    if (total === 10) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-2 text-xl";
      return "col-span-1 row-span-1 text-base";
    }

    // 11 Items Strategy (Target 16 cells):
    if (total === 11) {
      if (index === 0) return "col-span-2 row-span-2 text-xl";
      if (index === 1) return "col-span-2 row-span-1 text-lg";
      if (index === 2) return "col-span-2 row-span-1 text-lg";
      return "col-span-1 row-span-1 text-base";
    }

    return "col-span-1 row-span-1 text-base";
  };

  const getStatusColorClass = (stock: StockPosition) => {
    if (stock.ticker.startsWith('Others')) return 'bg-slate-700';
    switch (stock.status) {
      case 'Beating Inflation': return 'bg-secondary'; // Blue
      case 'Tracking Market': return 'bg-positive'; // Green
      case 'Losing Power': return 'bg-primary'; // Purple
      default: return 'bg-slate-700';
    }
  };

  // Calculate strict Top 10 Weight for footer risk metric
  const top10RiskWeight = sortedByWeight.slice(0, 10).reduce((acc, curr) => acc + curr.weight, 0);

  return (
    <div className="flex flex-col h-full p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto custom-scrollbar">
      <header className="mb-8">
        <h1 className="text-white text-3xl md:text-4xl font-black font-display leading-tight">Portfolio Composition Analysis</h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
          <p className="text-muted text-base">The size of each rectangle represents the % of Portfolio (Allocation). Colors indicate real return performance.</p>

          <div className="flex flex-wrap items-center gap-4 text-sm bg-surface p-2 rounded-lg border border-outline w-fit">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="text-muted">Beating Inflation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-positive"></div>
              <span className="text-muted">Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted">Losing Power</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Grid Treemap */}
      <div className="flex-grow flex flex-col gap-6 mb-8">
        {gridItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-4 gap-2 h-[500px] w-full rounded-xl bg-surface p-2 border border-outline">
            {gridItems.map((stock, index) => {
              const isOthers = stock.ticker.startsWith("Others");
              const colorClass = getStatusColorClass(stock);
              return (
                <div
                  key={stock.ticker}
                  onClick={() => !isOthers && onSelectStock(stock.ticker)}
                  className={`${getGridClasses(index, totalItems)} ${colorClass} flex flex-col items-center justify-center rounded-lg p-1 md:p-2 transition-transform hover:scale-[0.98] ${isOthers ? 'cursor-default opacity-80' : 'cursor-pointer'} overflow-hidden border border-white/5 relative`}
                >
                  <div className="text-center w-full z-10">
                    <span className="text-white font-bold block truncate px-1 text-shadow-sm text-[0.7em] md:text-base leading-tight">
                      {isOthers ? 'Others' : stock.ticker.toUpperCase()}
                    </span>
                    <span className="text-white/90 text-[0.6em] md:text-sm font-medium block">
                      {stock.weight}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[200px] w-full rounded-xl bg-surface border border-outline flex items-center justify-center text-muted">
            Add positions to view analysis
          </div>
        )}

      </div>

      <div className="flex-shrink-0">
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <table className="w-full text-left">
            <thead className="bg-[#1c2227] border-b border-outline">
              <tr>
                <th className="p-4 text-sm font-medium text-white">Ticker</th>
                <th className="p-4 text-sm font-medium text-white w-1/3">Weight</th>
                <th className="p-4 text-sm font-medium text-white">Sector/Category</th>
                <th className="p-4 text-sm font-medium text-white">CAGR</th>
              </tr>
            </thead>
            <tbody>
              {gridItems.map((stock) => {
                const isOthers = stock.ticker.startsWith("Others");
                const colorClass = getStatusColorClass(stock);
                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => !isOthers && onSelectStock(stock.ticker)}
                    className={`border-t border-outline transition-colors ${isOthers ? '' : 'hover:bg-white/5 cursor-pointer'}`}
                  >
                    <td className="p-4 align-middle text-sm text-white font-medium">{stock.ticker.toUpperCase()}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="relative h-4 w-full max-w-xs rounded-full bg-outline overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colorClass}`}
                            style={{ width: `${Math.max(stock.weight, 1)}%` }} // Ensure at least 1% visual width
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-white min-w-[3rem]">{stock.weight}%</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-sm text-muted">{stock.sector}</td>
                    <td className={`p-4 align-middle text-sm font-medium ${stock.cagr >= 0 ? 'text-secondary' : 'text-primary'}`}>
                      {isOthers ? '-' : (stock.cagr > 0 ? '+' : '') + PERCENT_FORMATTER.format(stock.cagr / 100)}
                    </td>
                  </tr>
                )
              })}
              {gridItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted">No positions found. Add data in the Portfolio tab.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-8 bg-surface border-t border-outline p-4 rounded-xl">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted">Total Positions:</p>
            <p className="text-sm font-semibold text-white">{portfolio.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted">Top 10 Holdings (Concentration Risk):</p>
            <p className="text-sm font-semibold text-white">{top10RiskWeight.toFixed(1)}% of Portfolio</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioAnalysis;