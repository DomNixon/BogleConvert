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

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import Settings from './components/Settings';
import StockReport from './components/StockReport';
import HelpAbout from './components/HelpAbout';
import SupportPage from './components/SupportPage';
import { ViewState, UserProfile, StockPosition, ChartDataPoint } from './types';
import {
  getUserProfile,
  getPortfolioData,
  getChartData,
  fetchStockQuote,
  getCumulativeInflation,
  DEMO_PORTFOLIO,
  refreshMarketData,
  getLastDataUpdate,
  savePortfolio,
  calculateStats,
  mergePortfolios,
  mergeStockIntoPortfolio
} from './services/dataService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<StockPosition[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTicker, setReportTicker] = useState<string>("AAPL");
  const [lastDataUpdate, setLastDataUpdate] = useState<string | null>(null);

  // Import progress tracking
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importError, setImportError] = useState<string | null>(null);



  // Helper to recalculate portfolio weights based on current value
  const recalculateWeights = (portfolioData: StockPosition[]): StockPosition[] => {
    const totalValue = portfolioData.reduce((sum, stock) => {
      const value = (stock.currentPrice || 0) * (stock.shares || 0);
      return sum + value;
    }, 0);

    if (totalValue === 0) {
      return portfolioData.map(stock => ({ ...stock, weight: 0 }));
    }

    return portfolioData.map(stock => {
      const value = (stock.currentPrice || 0) * (stock.shares || 0);
      const weight = (value / totalValue) * 100;
      return { ...stock, weight: Number(weight.toFixed(1)) };
    });
  };

  useEffect(() => {
    const initData = async () => {
      try {
        await refreshMarketData(); // On-Demand Refresh Check

        const [userData, portfolioData] = await Promise.all([
          getUserProfile(),
          getPortfolioData()
        ]);

        setUser(userData);

        // On Page Refresh: Refresh all stock data and remove empty rows
        const cleanedPortfolio = portfolioData.filter(p => p.ticker.trim() !== "");
        const updatedPortfolio = await Promise.all(cleanedPortfolio.map(async (stock) => {
          try {
            const quote = await fetchStockQuote(stock.ticker);
            if (quote) {
              stock.currentPrice = quote.price;
              stock.name = quote.name;
              stock.sector = quote.sector;
              stock.lastUpdated = quote.lastUpdated;
              return calculateStats(stock);
            }
          } catch (e) {
            console.error(`Failed to refresh data for ${stock.ticker}`, e);
          }
          return stock;
        }));

        // Recalculate weights after all stats are computed
        const portfolioWithWeights = recalculateWeights(updatedPortfolio);
        setPortfolio(portfolioWithWeights);

        // Initial Chart Load
        const initialChartData = await getChartData(updatedPortfolio);
        setChartData(initialChartData);

        // Get Timestamp
        setLastDataUpdate(getLastDataUpdate());

      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const [benchmark, setBenchmark] = useState<'VT' | 'VTI' | 'VOO'>('VT');

  // Recalculate chart data whenever portfolio or benchmark changes
  useEffect(() => {
    const updateChart = async () => {
      if (!loading) {
        const newChartData = await getChartData(portfolio, benchmark);
        setChartData(newChartData);
      }
    };
    updateChart();
  }, [portfolio, benchmark, loading]);

  // Auto-Save Portfolio to Local Storage
  useEffect(() => {
    if (!loading && portfolio.length > 0) {
      savePortfolio(portfolio);
    }
  }, [portfolio, loading]);

  const handleUpdateStock = (index: number, field: keyof StockPosition, value: string | number) => {
    setPortfolio(prevPortfolio => {
      const newPortfolio = [...prevPortfolio];
      const stock = { ...newPortfolio[index] };

      // Update the specific field
      // FIX: Use type assertion for dynamic key access to ensure type safety
      if (field in stock) {
        (stock as any)[field] = value;
      }

      // Recalculate returns if Average Cost or Years is updated
      if (field === 'avgCost' || field === 'yearsHeld') {
        const updatedStock = calculateStats(stock);
        Object.assign(stock, updatedStock); // Merge updated stats back into stock object
      }

      newPortfolio[index] = stock;

      // Recalculate weights if shares changed
      if (field === 'shares') {
        return recalculateWeights(newPortfolio);
      }

      return newPortfolio;
    });
  };

  const handleTickerBlur = async (index: number, ticker: string) => {
    if (!ticker) return;

    try {
      const quote = await fetchStockQuote(ticker);
      if (quote) {
        setPortfolio(prev => {
          const newPortfolio = [...prev];
          const stock = { ...newPortfolio[index] };
          stock.name = quote.name;
          stock.currentPrice = quote.price;
          stock.sector = quote.sector;
          stock.lastUpdated = quote.lastUpdated;


          const updatedStock = calculateStats(stock);
          Object.assign(stock, updatedStock);

          // Check if this ticker exists elsewhere in the portfolio (excluding current index)
          const duplicateIndex = newPortfolio.findIndex((p, i) => i !== index && p.ticker.toUpperCase() === ticker.toUpperCase());

          if (duplicateIndex !== -1) {
            // Merge current into duplicate
            const merged = mergeStockIntoPortfolio([newPortfolio[duplicateIndex]], stock)[0];
            newPortfolio[duplicateIndex] = merged;

            // Remove the current row since it's now merged
            newPortfolio.splice(index, 1);
          } else {
            newPortfolio[index] = stock;
          }



          // Recalculate weights since currentPrice changed
          return recalculateWeights(newPortfolio);
        });
      }
    } catch (e) {
      console.error("Failed to fetch quote on blur", e);
    }
  };

  const handleDeleteRow = (index: number) => {
    setPortfolio(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Recalculate weights after deletion
      return recalculateWeights(filtered);
    });
  };

  // Wrapper for view navigation to handle cleanup
  const handleViewChange = (view: ViewState) => {
    // Cleanup empty rows when navigating away
    setPortfolio(prev => prev.filter(p => p.ticker.trim() !== ""));
    setCurrentView(view);
  };

  const handleViewReport = (ticker: string) => {
    setReportTicker(ticker);
    handleViewChange(ViewState.REPORT);
  };

  const handleViewGuide = () => {
    handleViewChange(ViewState.PHILOSOPHY);
  };

  const handleAddRow = () => {
    const newStock: StockPosition = {
      ticker: '',
      name: '',
      avgCost: 0,
      currentPrice: 0,
      shares: 0,
      yearsHeld: 0,
      nominalReturn: 0,
      inflationAdjReturn: 0,
      status: 'Tracking Market',
      sector: 'Unknown',
      weight: 0,
      cagr: 0
    };
    setPortfolio([...portfolio, newStock]);
  };

  const handleBulkImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      setImporting(true);
      setImportError(null);

      const rows = text.split('\n');
      const rawStocks: StockPosition[] = [];

      // Helper for cleaning numbers (strip currency, commas)
      const cleanNumber = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
      };

      // Skip header if present
      const startIdx = rows[0].toLowerCase().includes('ticker') ? 1 : 0;
      const validRows: Array<{ ticker: string; avgCost: number; shares: number; yearsHeld: number }> = [];

      // Parse all rows first
      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i].split(',').map(cell => cell.trim());
        if (row.length < 2 || !row[0]) continue;

        const ticker = row[0].toUpperCase();
        const avgCost = row[1] ? cleanNumber(row[1]) : 0;
        const shares = row[2] ? cleanNumber(row[2]) : 0;
        const yearsHeld = row[3] ? cleanNumber(row[3]) : 0;

        validRows.push({ ticker, avgCost, shares, yearsHeld });
      }

      setImportProgress({ current: 0, total: validRows.length });

      // Batch fetch quotes (10 at a time to avoid overwhelming the API)
      const BATCH_SIZE = 10;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (row) => {
            try {
              const quote = await fetchStockQuote(row.ticker);

              let stock: StockPosition = {
                ticker: row.ticker,
                name: quote?.name || row.ticker,
                avgCost: row.avgCost,
                currentPrice: quote?.price || 0,
                shares: row.shares,
                yearsHeld: row.yearsHeld,
                nominalReturn: 0,
                inflationAdjReturn: 0,
                status: 'Tracking Market',
                sector: quote?.sector || 'Unknown',
                weight: 0,
                cagr: 0,
                lastUpdated: quote?.lastUpdated || new Date().toLocaleString()
              };

              stock = calculateStats(stock);
              successCount++;
              return stock;
            } catch (err) {
              console.warn(`Could not fetch data for imported ticker ${row.ticker}`, err);
              failCount++;
              return null;
            }
          })
        );

        // Filter out failed fetches and add successful ones
        rawStocks.push(...batchResults.filter((s): s is StockPosition => s !== null));

        // Update progress
        setImportProgress({ current: Math.min(i + BATCH_SIZE, validRows.length), total: validRows.length });
      }

      // Show error summary if any failed
      if (failCount > 0) {
        setImportError(`Successfully imported ${successCount} of ${validRows.length} tickers. ${failCount} failed.`);
      }

      // 1. Consolidate the *imported* list first (handle duplicates within the CSV)
      const consolidatedImports = mergePortfolios([], rawStocks);

      // 2. Merge consolidated imports into main portfolio
      if (consolidatedImports.length > 0) {
        setPortfolio(prev => {
          const merged = mergePortfolios(prev, consolidatedImports);
          return recalculateWeights(merged);
        });
      }

      setImporting(false);

      // Clear progress after 3 seconds
      setTimeout(() => {
        setImportProgress({ current: 0, total: 0 });
        setImportError(null);
      }, 3000);
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    // Deep copy the demo portfolio to avoid reference issues
    const demo = JSON.parse(JSON.stringify(DEMO_PORTFOLIO)) as StockPosition[];
    // Recalculate weights for demo data
    const demoWithWeights = recalculateWeights(demo);
    setPortfolio(demoWithWeights);
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const handleUpdateRow = (index: number, data: Partial<StockPosition>) => {
    setPortfolio(prev => {
      const newPortfolio = [...prev];
      const stock = { ...newPortfolio[index], ...data };

      // Recalculate stats if financial fields changed
      if ('avgCost' in data || 'yearsHeld' in data || 'currentPrice' in data) {
        Object.assign(stock, calculateStats(stock));
      }

      newPortfolio[index] = stock;

      // Recalculate weights if shares changed
      if ('shares' in data) {
        return recalculateWeights(newPortfolio);
      }

      return newPortfolio;
    });
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-secondary animate-pulse">candlestick_chart</span>
          <p className="text-muted animate-pulse font-display">Loading BogleConvert...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return (
          <Dashboard
            portfolio={portfolio}
            chartData={chartData}
            onUpdateStock={handleUpdateStock}
            onUpdateRow={handleUpdateRow}
            onTickerBlur={handleTickerBlur}
            onDeleteRow={handleDeleteRow}
            onViewReport={handleViewReport}
            onAddRow={handleAddRow}
            onBulkImport={handleBulkImport}
            onLoadDemo={handleLoadDemo}
            benchmark={benchmark}
            onBenchmarkChange={setBenchmark}
            onViewGuide={handleViewGuide}
            lastUpdated={lastDataUpdate}
            importing={importing}
            importProgress={importProgress}
            importError={importError}
          />
        );
      case ViewState.ANALYSIS:
        return (
          <PortfolioAnalysis
            portfolio={portfolio}
            onSelectStock={handleViewReport}
          />
        );
      case ViewState.SETTINGS:
        return (
          <Settings
            user={user}
            portfolio={portfolio}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case ViewState.REPORT:
        return (
          <StockReport
            portfolio={portfolio}
            initialTicker={reportTicker}
          />
        );
      case ViewState.PHILOSOPHY:
        return (
          <HelpAbout />
        );
      case ViewState.SUPPORT:
        return (
          <SupportPage />
        );
      default:
        return (
          <Dashboard
            portfolio={portfolio}
            chartData={chartData}
            onUpdateStock={handleUpdateStock}
            onUpdateRow={handleUpdateRow}
            onTickerBlur={handleTickerBlur}
            onDeleteRow={handleDeleteRow}
            onViewReport={handleViewReport}
            onAddRow={handleAddRow}
            onBulkImport={handleBulkImport}
            onLoadDemo={handleLoadDemo}
            benchmark={benchmark}
            onBenchmarkChange={setBenchmark}
            onViewGuide={handleViewGuide}
            importing={importing}
            importProgress={importProgress}
            importError={importError}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-dark text-white font-sans selection:bg-primary selection:text-white">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} user={user} />
      <main className="flex-1 relative overflow-hidden bg-bg-dark">
        {renderContent()}
      </main>

      {/* Mobile Nav Overlay */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline flex justify-around p-3 z-50 pb-safe">
        <button
          onClick={() => handleViewChange(ViewState.DASHBOARD)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.DASHBOARD ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.DASHBOARD ? 'fill' : ''}`}>pie_chart</span>
          <span className="text-[10px]">Portfolio</span>
        </button>
        <button
          onClick={() => handleViewChange(ViewState.REPORT)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.REPORT ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.REPORT ? 'fill' : ''}`}>description</span>
          <span className="text-[10px]">Report</span>
        </button>
        <button
          onClick={() => handleViewChange(ViewState.ANALYSIS)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.ANALYSIS ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.ANALYSIS ? 'fill' : ''}`}>analytics</span>
          <span className="text-[10px]">Analysis</span>
        </button>
        <button
          onClick={() => handleViewChange(ViewState.SETTINGS)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.SETTINGS ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.SETTINGS ? 'fill' : ''}`}>settings</span>
          <span className="text-[10px]">Settings</span>
        </button>
        <button
          onClick={() => handleViewChange(ViewState.SUPPORT)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.SUPPORT ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.SUPPORT ? 'fill' : ''}`}>volunteer_activism</span>
          <span className="text-[10px]">Support</span>
        </button>
      </div>
    </div>
  );
};

export default App;