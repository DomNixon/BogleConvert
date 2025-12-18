import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import Settings from './components/Settings';
import StockReport from './components/StockReport';
import HelpAbout from './components/HelpAbout';
import { ViewState, UserProfile, StockPosition, ChartDataPoint } from './types';
import { getUserProfile, getPortfolioData, getChartData, fetchStockQuote, getCumulativeInflation, savePortfolio } from './services/dataService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.PHILOSOPHY);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<StockPosition[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTicker, setReportTicker] = useState<string>("AAPL");
  const [benchmark, setBenchmark] = useState<'VT' | 'VTI' | 'VOO'>('VT');

  // Helper to recalculate row stats (Returns, CAGR)
  const calculateStats = (stock: StockPosition) => {
    if (stock.avgCost > 0 && stock.currentPrice > 0) {
      // Nominal Return %
      const nominalReturn = ((stock.currentPrice - stock.avgCost) / stock.avgCost) * 100;
      stock.nominalReturn = Number(nominalReturn.toFixed(1));
      
      // Real Buying Power Calculation (Inflation Adjusted)
      // Uses historical data based on years held
      const cumulativeInflation = getCumulativeInflation(stock.yearsHeld);
      
      // Real Return Formula: ((1 + Nominal) / (1 + CumulativeInflation)) - 1
      const realReturn = ((1 + nominalReturn/100) / (1 + cumulativeInflation) - 1) * 100;
      stock.inflationAdjReturn = Number(realReturn.toFixed(1));
      
      // Calculate CAGR (Annual Growth)
      const years = stock.yearsHeld > 0 ? stock.yearsHeld : 0.1; // Avoid divide by zero
      const totalRatio = stock.currentPrice / stock.avgCost;
      // Formula: (Ending / Beginning) ^ (1 / n) - 1
      const cagr = (Math.pow(totalRatio, 1 / years) - 1) * 100;
      stock.cagr = Number(cagr.toFixed(1));

      if (stock.inflationAdjReturn > 0) stock.status = 'Beating Inflation';
      else if (stock.inflationAdjReturn > -5) stock.status = 'Tracking Market';
      else stock.status = 'Losing Power';
    } else {
        stock.nominalReturn = 0;
        stock.inflationAdjReturn = 0;
        stock.status = 'Tracking Market';
        stock.cagr = 0;
    }
    return stock;
  };

  // Helper to recalculate portfolio weights
  const recalculateWeights = (stocks: StockPosition[]): StockPosition[] => {
      const totalValue = stocks.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
      return stocks.map(p => ({
          ...p,
          weight: totalValue > 0 ? Number(((p.shares * p.currentPrice) / totalValue * 100).toFixed(1)) : 0
      }));
  };

  useEffect(() => {
    const initData = async () => {
      try {
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
        
        // Recalculate weights ensures correct Allocation % even if mock data was off
        const finalPortfolio = recalculateWeights(updatedPortfolio);
        
        setPortfolio(finalPortfolio);

        // Initial Chart Load
        const initialChartData = await getChartData(finalPortfolio, benchmark);
        setChartData(initialChartData);

      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (loading) return;

    const saveTimeout = setTimeout(() => {
      savePortfolio(portfolio);
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [portfolio, loading]);

  // DEBOUNCED Chart Data Generation
  // This prevents the expensive simulation loop from running on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
         if (!loading) {
            const newChartData = await getChartData(portfolio, benchmark);
            setChartData(newChartData);
        }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [portfolio, benchmark, loading]);

  const handleUpdateStock = useCallback((index: number, field: keyof StockPosition, value: string | number) => {
    setPortfolio(prevPortfolio => {
      const newPortfolio = [...prevPortfolio];
      const stock = { ...newPortfolio[index] };

      // Update the specific field
      (stock as any)[field] = value;

      // Recalculate returns if Average Cost or Years is updated
      if (field === 'avgCost' || field === 'yearsHeld') {
         calculateStats(stock);
      }

      newPortfolio[index] = stock;
      return recalculateWeights(newPortfolio);
    });
  }, []);

  const handleTickerBlur = useCallback(async (index: number, ticker: string) => {
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
          
          calculateStats(stock);
          
          newPortfolio[index] = stock;
          return recalculateWeights(newPortfolio);
        });
      }
    } catch (e) {
      console.error("Failed to fetch quote on blur", e);
    }
  }, []);

  const handleUpdateRow = useCallback((index: number, data: Partial<StockPosition>) => {
    setPortfolio(prev => {
      const newPortfolio = [...prev];
      let stock = { ...newPortfolio[index], ...data };
      
      // Recalculate stats
      stock = calculateStats(stock);
      
      newPortfolio[index] = stock;
      return recalculateWeights(newPortfolio);
    });

    if (data.ticker) {
        handleTickerBlur(index, data.ticker);
    }
  }, [handleTickerBlur]);

  const handleDeleteRow = useCallback((index: number) => {
    setPortfolio(prev => {
        const newPortfolio = prev.filter((_, i) => i !== index);
        return recalculateWeights(newPortfolio);
    });
  }, []);

  // Wrapper for view navigation to handle cleanup
  const handleViewChange = useCallback((view: ViewState) => {
      // Cleanup empty rows when navigating away
      setPortfolio(prev => {
          const filtered = prev.filter(p => p.ticker.trim() !== "");
          return recalculateWeights(filtered);
      });
      setCurrentView(view);
  }, []);
  
  const handleViewReport = useCallback((ticker: string) => {
      setReportTicker(ticker);
      handleViewChange(ViewState.REPORT);
  }, [handleViewChange]);

  const handleAddRow = useCallback(() => {
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
      setPortfolio(prev => recalculateWeights([...prev, newStock]));
  }, []);

  const handleBulkImport = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text) return;

          const rows = text.split('\n');
          const newStocks: StockPosition[] = [];

          // Skip header if present (naive check)
          const startIdx = rows[0].toLowerCase().includes('ticker') ? 1 : 0;

          for (let i = startIdx; i < rows.length; i++) {
              const row = rows[i].split(',').map(cell => cell.trim());
              if (row.length >= 4 && row[0]) {
                  const ticker = row[0].toUpperCase();
                  const avgCost = parseFloat(row[1]) || 0;
                  const shares = parseFloat(row[2]) || 0;
                  const yearsHeld = parseFloat(row[3]) || 0;

                  // Fetch current data for the imported ticker
                  let currentPrice = 0;
                  let name = '';
                  let sector = '';
                  let lastUpdated = '';
                  
                  try {
                    const quote = await fetchStockQuote(ticker);
                    if (quote) {
                        currentPrice = quote.price;
                        name = quote.name;
                        sector = quote.sector;
                        lastUpdated = quote.lastUpdated;
                    }
                  } catch (err) {
                      console.warn(`Could not fetch data for imported ticker ${ticker}`);
                  }

                  let stock: StockPosition = {
                      ticker,
                      name,
                      avgCost,
                      currentPrice,
                      shares,
                      yearsHeld,
                      nominalReturn: 0,
                      inflationAdjReturn: 0,
                      status: 'Tracking Market',
                      sector: sector || 'Unknown',
                      weight: 0,
                      cagr: 0,
                      lastUpdated
                  };
                  
                  stock = calculateStats(stock);
                  newStocks.push(stock);
              }
          }
          
          // Append new stocks to existing portfolio and recalc weights
          if (newStocks.length > 0) {
              setPortfolio(prev => recalculateWeights([...prev, ...newStocks]));
          }
      };
      reader.readAsText(file);
  }, []);

  const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
      if (user) {
          setUser({ ...user, ...updates });
      }
  }, [user]);

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
      case ViewState.PHILOSOPHY:
        return <HelpAbout />;
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
            benchmark={benchmark}
            onBenchmarkChange={setBenchmark}
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
                benchmark={benchmark}
                onBenchmarkChange={setBenchmark}
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
          onClick={() => handleViewChange(ViewState.PHILOSOPHY)}
          className={`flex flex-col items-center gap-1 ${currentView === ViewState.PHILOSOPHY ? 'text-secondary' : 'text-muted'}`}
        >
          <span className={`material-symbols-outlined ${currentView === ViewState.PHILOSOPHY ? 'fill' : ''}`}>menu_book</span>
          <span className="text-[10px]">Guide</span>
        </button>
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
      </div>
    </div>
  );
};

export default App;