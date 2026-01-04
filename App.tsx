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
import { parseAndFetchPortfolio } from './services/importService';
import { usePortfolio } from './hooks/usePortfolio';
import { DEFAULT_BENCHMARK, DEFAULT_REPORT_TICKER } from './constants';




const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [user, setUser] = useState<UserProfile | null>(null);
  const {
    portfolio,
    setPortfolio,
    updateStock,
    addStock,
    deleteStock,
    updateTicker,
    updateRow,
    recalculateWeights
  } = usePortfolio();

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTicker, setReportTicker] = useState<string>(DEFAULT_REPORT_TICKER);
  const [lastDataUpdate, setLastDataUpdate] = useState<string | null>(null);

  // Import progress tracking
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importError, setImportError] = useState<string | null>(null);


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
  }, [recalculateWeights]);

  const [benchmark, setBenchmark] = useState<'VT' | 'VTI' | 'VOO'>(DEFAULT_BENCHMARK);

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



  const handleBulkImport = (file: File) => {
    setImporting(true);
    setImportError(null);
    setImportProgress({ current: 0, total: 0 });

    parseAndFetchPortfolio(
      file,
      fetchStockQuote,
      calculateStats,
      mergePortfolios,
      (current, total) => setImportProgress({ current, total })
    ).then((consolidatedImports) => {
      // Merge consolidated imports into main portfolio
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
    }).catch((err) => {
      console.error("Import failed", err);
      setImportError("Failed to parse file or fetch data.");
      setImporting(false);
    });
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
            onUpdateStock={updateStock}
            onUpdateRow={updateRow}
            onTickerBlur={updateTicker}
            onDeleteRow={deleteStock}
            onViewReport={handleViewReport}
            onAddRow={addStock}
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
            onUpdateStock={updateStock}
            onUpdateRow={updateRow}
            onTickerBlur={updateTicker}
            onDeleteRow={deleteStock}
            onViewReport={handleViewReport}
            onAddRow={addStock}
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
          aria-label="Portfolio"
          onClick={() => handleViewChange(ViewState.DASHBOARD)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.DASHBOARD ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.DASHBOARD ? 'fill' : ''}`}>pie_chart</span>
          <span className="text-[10px]">Portfolio</span>
        </button>
        <button
          aria-label="Stock Report"
          onClick={() => handleViewChange(ViewState.REPORT)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.REPORT ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.REPORT ? 'fill' : ''}`}>description</span>
          <span className="text-[10px]">Report</span>
        </button>
        <button
          aria-label="Analysis"
          onClick={() => handleViewChange(ViewState.ANALYSIS)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.ANALYSIS ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.ANALYSIS ? 'fill' : ''}`}>analytics</span>
          <span className="text-[10px]">Analysis</span>
        </button>
        <button
          aria-label="Settings"
          onClick={() => handleViewChange(ViewState.SETTINGS)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.SETTINGS ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.SETTINGS ? 'fill' : ''}`}>settings</span>
          <span className="text-[10px]">Settings</span>
        </button>
        <button
          aria-label="Support"
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