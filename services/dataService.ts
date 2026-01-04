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

import { StockPosition, ChartDataPoint, UserProfile } from '../types';
import {
  HISTORICAL_INFLATION_RATES,
  VT_ANNUAL_RETURNS,
  VTI_ANNUAL_RETURNS,
  VOO_ANNUAL_RETURNS,
  LAST_DATA_YEAR
} from '../constants';

// Data Currency Warning
if (new Date().getFullYear() > LAST_DATA_YEAR) {
  console.warn(`WARNING: BogleConvert historical data ends in ${LAST_DATA_YEAR}. Please update constants.ts with newer inflation and market return data.`);
}

// Type for stock quote data returned from API
export type StockQuote = {
  price: number;
  name: string;
  sector: string;
  lastUpdated: string;
  dailyChange?: number;
  yearlyReturn?: number;
};

/**
 * Helper to recalculate row stats
 */
export const calculateStats = (stock: StockPosition): StockPosition => {
  if (stock.avgCost > 0 && stock.currentPrice > 0) {
    // Nominal Return %
    const nominalReturn = ((stock.currentPrice - stock.avgCost) / stock.avgCost) * 100;
    stock.nominalReturn = Number(nominalReturn.toFixed(1));

    // Real Buying Power Calculation (Inflation Adjusted)
    // Uses historical data based on years held
    const cumulativeInflation = getCumulativeInflation(stock.yearsHeld);

    // Real Return Formula: ((1 + Nominal) / (1 + CumulativeInflation)) - 1
    const realReturn = ((1 + nominalReturn / 100) / (1 + cumulativeInflation) - 1) * 100;
    stock.inflationAdjReturn = Number(realReturn.toFixed(1));

    // Calculate CAGR (Annual Growth)
    // For holdings < 1 year, use 1 year minimum to avoid unrealistic CAGR spikes
    const years = stock.yearsHeld > 0 ? Math.max(stock.yearsHeld, 1) : 1;
    const totalRatio = stock.currentPrice / stock.avgCost;
    // Formula: (Ending / Beginning) ^ (1 / n) - 1
    const cagr = (Math.pow(totalRatio, 1 / years) - 1) * 100;
    stock.cagr = Number(cagr.toFixed(1));

    if (stock.inflationAdjReturn >= 1) stock.status = 'Beating Inflation';
    else if (stock.inflationAdjReturn >= -1) stock.status = 'Tracking Market';
    else stock.status = 'Losing Power';
  } else {
    stock.nominalReturn = 0;
    stock.inflationAdjReturn = 0;
    stock.status = 'Tracking Market';
    stock.cagr = 0;
  }
  return stock;
};

/**
 * Merges a single stock position into a list of existing positions.
 * Updates stats if merged.
 */
export const mergeStockIntoPortfolio = (portfolio: StockPosition[], newStock: StockPosition): StockPosition[] => {
  const existingIndex = portfolio.findIndex(p => p.ticker.toUpperCase() === newStock.ticker.toUpperCase());

  if (existingIndex === -1) {
    return [...portfolio, newStock];
  }

  const existing = portfolio[existingIndex];
  const existingShares = Number(existing.shares) || 0;
  const newShares = Number(newStock.shares) || 0;
  const totalShares = existingShares + newShares;

  // If total shares is 0, just update meta data provided by new stock but keep 0 cost/shares logic
  if (totalShares === 0) {
    const merged: StockPosition = {
      ...existing,
      ...newStock, // Overwrite with potentially newer name/sector/price
      shares: 0,
      avgCost: 0,
      yearsHeld: Math.max(existing.yearsHeld, newStock.yearsHeld)
    };
    return [
      ...portfolio.slice(0, existingIndex),
      calculateStats(merged),
      ...portfolio.slice(existingIndex + 1)
    ];
  }

  // Weighted Average Cost
  const existingCost = existingShares * (Number(existing.avgCost) || 0);
  const newCost = newShares * (Number(newStock.avgCost) || 0);
  const weightedAvgCost = (existingCost + newCost) / totalShares;

  // Weighted Average Years Held (to prevent CAGR distortion)
  // We weight by Total Cost invested to represent the "age" of the capital.
  let weightedYearsHeld = 0;
  if (existingCost + newCost > 0) {
    weightedYearsHeld = ((existingCost * existing.yearsHeld) + (newCost * newStock.yearsHeld)) / (existingCost + newCost);
  } else {
    // Fallback to max if no cost basis (e.g. gifted/zero cost)
    weightedYearsHeld = Math.max(existing.yearsHeld, newStock.yearsHeld);
  }

  const mergedStock: StockPosition = {
    ...existing,
    name: newStock.name || existing.name,
    sector: newStock.sector || existing.sector,
    currentPrice: newStock.currentPrice || existing.currentPrice,
    lastUpdated: newStock.lastUpdated || existing.lastUpdated,
    shares: totalShares,
    avgCost: weightedAvgCost,
    yearsHeld: parseFloat(weightedYearsHeld.toFixed(2))
  };

  const updatedStock = calculateStats(mergedStock);

  return [
    ...portfolio.slice(0, existingIndex),
    updatedStock,
    ...portfolio.slice(existingIndex + 1)
  ];
};

/**
 * Merges two full portfolios.
 */
export const mergePortfolios = (current: StockPosition[], incoming: StockPosition[]): StockPosition[] => {
  let merged = [...current];
  for (const stock of incoming) {
    merged = mergeStockIntoPortfolio(merged, stock);
  }
  return merged;
};

// In a real Cloudflare Worker environment, these would be fetched via `fetch('/api/portfolio')`
// managed by a Worker utilizing KV or D1 database.

const STORAGE_KEY = 'bogleconvert_portfolio';

// Simple in-memory cache to prevent redundant fetches/calculations in a session
const QUOTE_CACHE: Map<string, { data: StockQuote; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const savePortfolio = (portfolio: StockPosition[]): void => {
  try {
    const data = JSON.stringify(portfolio);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.error('LocalStorage quota exceeded. Portfolio size:', JSON.stringify(portfolio).length, 'bytes');

      // Show user-friendly error
      alert(
        'Portfolio data exceeds storage limit.\n\n' +
        'Your portfolio is too large to save automatically.\n' +
        'Please export your portfolio to CSV from Settings to back up your data.'
      );
    } else {
      console.error("Failed to save portfolio to local storage", e);
    }
  }
};

// Historical data moved to constants.ts

// Master Price Cache (populated once per session or from local storage)
let MASTER_PRICE_CACHE: Record<string, { price: number; name?: string; sector?: string; industry?: string }> | null = null;
let FETCH_PROMISE: Promise<void> | null = null;
const MASTER_PRICE_STORAGE_KEY = 'bogleconvert_master_prices_cache';
const MASTER_PRICE_TIMESTAMP_KEY = 'bogleconvert_master_prices_ts';
const MASTER_PRICE_VERSION_KEY = 'bogleconvert_cache_version';
// Increment this to force all clients to drop their cache and re-fetch
const CACHE_VERSION = 'v2_rich_data';

// Cache Duration: 4 hours (matching Worker Cache-Control) or 24h as preferred.
// Logic: If user reloads page, we don't hit worker if data is fresh enough.
const CLIENT_CACHE_DURATION = 4 * 60 * 60 * 1000;

const fetchMasterPrices = async (): Promise<void> => {
  if (MASTER_PRICE_CACHE) return;

  // 1. Try Local Storage
  try {
    const stored = localStorage.getItem(MASTER_PRICE_STORAGE_KEY);
    const ts = localStorage.getItem(MASTER_PRICE_TIMESTAMP_KEY);
    const version = localStorage.getItem(MASTER_PRICE_VERSION_KEY);

    // Version Check: If version mismatch, ignore stored data to force refresh
    if (stored && ts && version === CACHE_VERSION) {
      const age = Date.now() - parseInt(ts, 10);
      if (age < CLIENT_CACHE_DURATION) {
        MASTER_PRICE_CACHE = JSON.parse(stored) as Record<string, { price: number; name?: string; sector?: string; industry?: string }>;
        return;
      }
    }
  } catch (e) { console.error("Cache read error", e); }

  // 2. Fetch from Network if missing or stale
  if (FETCH_PROMISE) return FETCH_PROMISE;

  FETCH_PROMISE = (async () => {
    try {
      // Append version to URL to bypass browser HTTP cache and ensure we get the
      // new data structure corresponding to this version.
      const res = await fetch(`/api/batch-quote?v=${CACHE_VERSION}`);
      if (!res.ok) throw new Error('Failed to fetch prices');
      const data = await res.json();

      MASTER_PRICE_CACHE = data as Record<string, { price: number; name?: string; sector?: string; industry?: string }>;

      // Save to Local Storage with Version
      try {
        localStorage.setItem(MASTER_PRICE_STORAGE_KEY, JSON.stringify(data));
        const now = Date.now().toString();
        localStorage.setItem(MASTER_PRICE_TIMESTAMP_KEY, now);
        localStorage.setItem(MASTER_PRICE_VERSION_KEY, CACHE_VERSION);
      } catch (e) { console.error("Cache write error", e); }

    } catch (e) {
      console.error("Error fetching master prices:", e);
      MASTER_PRICE_CACHE = {}; // Fallback
    } finally {
      FETCH_PROMISE = null;
    }
  })();

  return FETCH_PROMISE;
};

export const getLastDataUpdate = (): string | null => {
  const tsStr = localStorage.getItem(MASTER_PRICE_TIMESTAMP_KEY);
  if (!tsStr) return null;
  return new Date(parseInt(tsStr, 10)).toLocaleString();
};

export const getUserProfile = async (): Promise<UserProfile> => {
  // Local-first: No external user profiles. This is a placeholder for the UI.
  // The app intentionally does not collect or store personal user data.
  return {
    name: "Local User",
    email: "",
    avatarUrl: ""
  };
};

export const refreshMarketData = async (): Promise<void> => {
  try {
    // Trigger the on-demand refresh endpoint
    // This endpoint now intelligently only fetches if data is missing or stale
    const res = await fetch('/api/refresh-data');
    if (!res.ok) {
      console.warn('Market data refresh failed', res.statusText);
    }
  } catch (e) {
    console.error('Error triggering market data refresh', e);
  }
};

export const fetchStockQuote = async (ticker: string): Promise<StockQuote | null> => {
  if (!ticker) return null;
  const t = ticker.toUpperCase();

  // Check Cache
  const now = Date.now();
  const cached = QUOTE_CACHE.get(t);
  if (cached && (now - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  // Ensure we have the master price list
  if (!MASTER_PRICE_CACHE) {
    await fetchMasterPrices();
  }

  // Use Known Real Price if available
  const priceData = MASTER_PRICE_CACHE?.[t];
  let currentPrice = priceData?.price || 0;
  let name = priceData?.name || '';
  let sector = priceData?.sector || '';

  if (currentPrice === 0) {
    console.warn(`No price found for ${t}`);
  }

  // Fallback to Known Data if API didn't provide name/sector
  const knownData: { [key: string]: { name: string, sector: string } } = {
    'AAPL': { name: 'Apple Inc.', sector: 'Technology' },
    'NVDA': { name: 'NVIDIA Corp', sector: 'Technology' },
    'MSFT': { name: 'Microsoft Corp', sector: 'Technology' },
    'GOOGL': { name: 'Alphabet Inc.', sector: 'Communication' },
    'GOOG': { name: 'Alphabet Inc.', sector: 'Communication' },
    'AMZN': { name: 'Amazon.com Inc', sector: 'Consumer Discretionary' },
    'TSLA': { name: 'Tesla Inc', sector: 'Consumer Discretionary' },
    'V': { name: 'Visa Inc.', sector: 'Financials' },
    'JNJ': { name: 'Johnson & Johnson', sector: 'Healthcare' },
    'META': { name: 'Meta Platforms', sector: 'Communication' },
    'AMD': { name: 'Advanced Micro Devices', sector: 'Technology' },
    'NFLX': { name: 'Netflix Inc.', sector: 'Communication' },
    'INTC': { name: 'Intel Corp', sector: 'Technology' },
    'SPY': { name: 'SPDR S&P 500 ETF', sector: 'ETF' },
    'VOO': { name: 'Vanguard S&P 500 ETF', sector: 'ETF' },
    'QQQ': { name: 'Invesco QQQ Trust', sector: 'ETF' },
    'VT': { name: 'Vanguard Total World Stock ETF', sector: 'ETF' },
    'GLD': { name: 'SPDR Gold Shares', sector: 'Commodity' },
    'VTI': { name: 'Vanguard Total Stock Market', sector: 'ETF' },
    'DIS': { name: 'Walt Disney Co', sector: 'Communication' },
    'PFE': { name: 'Pfizer Inc.', sector: 'Healthcare' },
    'KO': { name: 'Coca-Cola Co', sector: 'Consumer Staples' },
    'PEP': { name: 'PepsiCo Inc', sector: 'Consumer Staples' },
    'COST': { name: 'Costco Wholesale', sector: 'Consumer Staples' },
    'WMT': { name: 'Walmart Inc', sector: 'Consumer Staples' },
    'BRK.B': { name: 'Berkshire Hathaway', sector: 'Financials' },
  };

  if (!name || !sector) {
    const info = knownData[t] || {
      name: t,
      sector: 'Unknown'
    };
    if (!name) name = info.name;
    if (!sector) sector = info.sector;
  }

  // Determine Last Updated Display
  // Use the global cache timestamp if available, otherwise current session time
  let lastUpdated = '';
  const cachedTS = localStorage.getItem(MASTER_PRICE_TIMESTAMP_KEY);
  if (cachedTS) {
    lastUpdated = new Date(parseInt(cachedTS, 10)).toLocaleString();
  } else {
    lastUpdated = new Date().toLocaleString();
  }

  const result = {
    price: currentPrice,
    name: name,
    sector: sector,
    // dailyChange: parseFloat(change.toFixed(2)),
    // yearlyReturn: parseFloat(yearlyReturn.toFixed(1)),
    lastUpdated
  };

  // Cache result
  QUOTE_CACHE.set(t, { data: result, timestamp: Date.now() });

  return result;
};

export const getAverageInflationRate = (years: number): number => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - Math.floor(years);
  const relevantRates = HISTORICAL_INFLATION_RATES.filter(r => r.year >= startYear).map(r => r.rate);

  if (relevantRates.length === 0) return 0.035;

  const sum = relevantRates.reduce((acc, rate) => acc + rate, 0);
  return (sum / relevantRates.length) / 100;
};

export const getCumulativeInflation = (yearsHeld: number): number => {
  if (yearsHeld <= 0) return 0;

  const rates = [...HISTORICAL_INFLATION_RATES].reverse();

  let totalInflation = 1;
  const fullYears = Math.floor(yearsHeld);
  const remainder = yearsHeld - fullYears;

  for (let i = 0; i < fullYears; i++) {
    const rate = rates[i] ? rates[i].rate : 3.0;
    totalInflation *= (1 + rate / 100);
  }

  if (remainder > 0) {
    const rate = rates[fullYears] ? rates[fullYears].rate : 3.0;
    totalInflation *= Math.pow((1 + rate / 100), remainder);
  }

  return totalInflation - 1;
};

export const getPortfolioData = async (): Promise<StockPosition[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  // Ensure we have master prices to hydrate valid data
  if (!MASTER_PRICE_CACHE) {
    await fetchMasterPrices();
  }

  // Check local storage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // HYDRATE PRICES: Update stored portfolio with latest prices from API
        const hydratedPortfolio = parsed.map((position: StockPosition) => {
          const latestData = MASTER_PRICE_CACHE?.[position.ticker.toUpperCase()];
          if (latestData && latestData.price > 0) {
            // Get global timestamp
            const tsStr = localStorage.getItem(MASTER_PRICE_TIMESTAMP_KEY);
            const ts = tsStr ? new Date(parseInt(tsStr, 10)).toLocaleString() : new Date().toLocaleString();

            return {
              ...position,
              currentPrice: latestData.price,
              lastUpdated: ts
            };
          }
          return position;
        });

        return hydratedPortfolio;
      }
    }
  } catch (e) {
    console.error("Failed to load from local storage", e);
  }

  // Fallback to empty if storage is empty
  return [];
};

// Demo portfolio for new users to explore the tool
// This represents a realistic "Stock Picker's Dilemma" portfolio:
// - Some picks worked out great, others flopped
// - Illustrates that stock picking is essentially a coin flip
// - Even with some winners, poor timing and sizing cause underperformance vs VTI
// - The message: "Why gamble when you can just own the whole market?"
// - All prices reflect real-world data as of January 2026
// NOTE: Weight values are placeholders - they are recalculated on load based on actual values
export const DEMO_PORTFOLIO: StockPosition[] = [
  // === THE WINNERS (Got Lucky) ===
  {
    // Solid long-term hold - bought before the AI boom
    ticker: "MSFT",
    name: "Microsoft Corp",
    avgCost: 280.00,
    currentPrice: 473.00,
    shares: 30,
    yearsHeld: 4,
    nominalReturn: 68.9,
    inflationAdjReturn: 52.5,
    status: "Beating Inflation",
    sector: "Technology",
    weight: 12.0,
    cagr: 14.0
  },
  {
    // Caught the META comeback after 2022 crash
    ticker: "META",
    name: "Meta Platforms",
    avgCost: 95.00,
    currentPrice: 650.00,
    shares: 20,
    yearsHeld: 2.5,
    nominalReturn: 584.2,
    inflationAdjReturn: 550.0,
    status: "Beating Inflation",
    sector: "Communication",
    weight: 10.0,
    cagr: 115.0
  },
  {
    // Good entry on AMZN post-split
    ticker: "AMZN",
    name: "Amazon.com Inc",
    avgCost: 85.00,
    currentPrice: 227.00,
    shares: 35,
    yearsHeld: 2.5,
    nominalReturn: 167.1,
    inflationAdjReturn: 150.5,
    status: "Beating Inflation",
    sector: "Consumer Discretionary",
    weight: 8.0,
    cagr: 48.5
  },
  {
    // Costco - bought at market high, modest gains
    ticker: "COST",
    name: "Costco Wholesale",
    avgCost: 720.00,
    currentPrice: 855.00,
    shares: 10,
    yearsHeld: 2,
    nominalReturn: 18.8,
    inflationAdjReturn: 10.2,
    status: "Beating Inflation",
    sector: "Consumer Staples",
    weight: 7.0,
    cagr: 9.0
  },
  {
    // Apple - reliable blue chip, strong performance
    ticker: "AAPL",
    name: "Apple Inc.",
    avgCost: 155.00,
    currentPrice: 271.00,
    shares: 40,
    yearsHeld: 3,
    nominalReturn: 74.8,
    inflationAdjReturn: 62.0,
    status: "Beating Inflation",
    sector: "Technology",
    weight: 8.0,
    cagr: 20.5
  },

  // === THE LOSERS (Bad Luck / Bad Timing) ===
  {
    // Bought near the late 2024 peak - gave back gains
    ticker: "TSLA",
    name: "Tesla Inc",
    avgCost: 480.00,
    currentPrice: 438.00,
    shares: 25,
    yearsHeld: 1.5,
    nominalReturn: -8.8,
    inflationAdjReturn: -14.2,
    status: "Losing Power",
    sector: "Consumer Discretionary",
    weight: 9.0,
    cagr: -5.9
  },
  {
    // Classic "value trap" - kept averaging down but finally recovering
    ticker: "INTC",
    name: "Intel Corp",
    avgCost: 55.00,
    currentPrice: 39.00,
    shares: 150,
    yearsHeld: 4,
    nominalReturn: -29.1,
    inflationAdjReturn: -38.5,
    status: "Losing Power",
    sector: "Technology",
    weight: 8.0,
    cagr: -8.2
  },
  {
    // Post-COVID pharma disappointment
    ticker: "PFE",
    name: "Pfizer Inc.",
    avgCost: 52.00,
    currentPrice: 25.00,
    shares: 100,
    yearsHeld: 3,
    nominalReturn: -51.9,
    inflationAdjReturn: -57.5,
    status: "Losing Power",
    sector: "Healthcare",
    weight: 6.0,
    cagr: -21.5
  },
  {
    // Disney+ hype that fizzled
    ticker: "DIS",
    name: "Walt Disney Co",
    avgCost: 175.00,
    currentPrice: 112.00,
    shares: 35,
    yearsHeld: 3,
    nominalReturn: -36.0,
    inflationAdjReturn: -43.0,
    status: "Losing Power",
    sector: "Communication",
    weight: 5.0,
    cagr: -13.5
  },
  {
    // "Safe" dividend stock that underperformed
    ticker: "VZ",
    name: "Verizon Communications",
    avgCost: 55.00,
    currentPrice: 40.50,
    shares: 80,
    yearsHeld: 4,
    nominalReturn: -26.4,
    inflationAdjReturn: -36.0,
    status: "Losing Power",
    sector: "Communication",
    weight: 4.0,
    cagr: -7.4
  }
];

export const getChartData = async (
  portfolio: StockPosition[] = [],
  benchmarkType: 'VT' | 'VTI' | 'VOO' = 'VT'
): Promise<ChartDataPoint[]> => {
  const currentYear = new Date().getFullYear();
  const VT_INCEPTION_YEAR = 2008;

  // Determine date range based on oldest investment
  // Default to 2 years (current + previous) to form a line if no valid yearsHeld found
  const maxYearsHeld = portfolio.length > 0
    ? portfolio.reduce((max, p) => Math.max(max, p.yearsHeld || 0), 0)
    : 0;

  // Calculate start year relative to now
  // Shift back by 1 additional year to create a baseline year at 0% growth
  // This ensures the first year's returns (e.g., 2022 drawdown) are visible
  // Ensure minimum 2 years for proper chart rendering (empty or very new portfolios)
  let calculatedStartYear = currentYear - Math.max(Math.ceil(maxYearsHeld), 2) - 1;

  // Clamp start year to VT Inception (2008)
  // This prevents data being pulled/shown older than the benchmark
  if (calculatedStartYear < VT_INCEPTION_YEAR) {
    calculatedStartYear = VT_INCEPTION_YEAR;
  }

  const startYear = calculatedStartYear;
  const yearsToShow = currentYear - startYear + 1;

  // Select benchmark data source
  let benchmarkSource = VT_ANNUAL_RETURNS;
  if (benchmarkType === 'VTI') benchmarkSource = VTI_ANNUAL_RETURNS;
  if (benchmarkType === 'VOO') benchmarkSource = VOO_ANNUAL_RETURNS;

  // Get data for the relevant window
  // Inflation Rates
  const relevantInflation = HISTORICAL_INFLATION_RATES.filter(d => d.year >= startYear);
  // Benchmark Returns
  const relevantBenchmark = benchmarkSource.filter(d => d.year >= startYear);

  // Normalized Index Approach (Start at 100)
  let inflationIndex = 100;
  let benchmarkIndex = 100;

  // Simulate Portfolio Value History
  // We reconstruct the portfolio's aggregate value over time to build a comparable index.
  const portfolioValues: number[] = new Array(yearsToShow).fill(0);

  portfolio.filter(p => p.ticker).forEach(stock => {
    let currentPrice = isNaN(stock.currentPrice) ? 0 : stock.currentPrice;
    const shares = isNaN(stock.shares) ? 0 : stock.shares;
    const years = stock.yearsHeld || 1;

    // 1. Calculate Implied CAGR of this stock (CAGR = (End/Start)^(1/n) - 1)
    let stockCAGR = 0;
    if (stock.avgCost > 0 && currentPrice > 0) {
      stockCAGR = Math.pow(currentPrice / stock.avgCost, 1 / years) - 1;
    }

    // 2. Calculate Benchmark CAGR for the same period using Selected Benchmark
    // to determine the stock's "Alpha" (excess return vs market)
    // This ensures correlation: If stock == Benchmark, Alpha == 0, so line follows benchmark.
    const holdingStartYear = currentYear - Math.max(1, Math.floor(years));
    const relevantBenchForAlpha = benchmarkSource.filter(d => d.year >= holdingStartYear);

    let benchTotalReturn = 1;
    relevantBenchForAlpha.forEach(b => {
      benchTotalReturn *= (1 + (b.return / 100));
    });

    // Annualize benchmark return for the holding period
    const benchCAGR = relevantBenchForAlpha.length > 0
      ? Math.pow(benchTotalReturn, 1 / relevantBenchForAlpha.length) - 1
      : 0.08; // Default 8% if no matching data or holding < 1yr

    const alpha = stockCAGR - benchCAGR;

    // 3. Generate Price History Backwards
    // Current Price is known. Previous prices are derived via P(t-1) = P(t) / (1 + r)
    // r = Market_Return(t) + Alpha
    const stockPrices: number[] = new Array(yearsToShow).fill(0);
    let simPrice = currentPrice;

    for (let i = yearsToShow - 1; i >= 0; i--) {
      stockPrices[i] = simPrice;

      const year = startYear + i;
      // Get market return for this specific historical year from SELECTED benchmark
      const mkt = benchmarkSource.find(r => r.year === year)?.return || 8.0;
      const marketRet = mkt / 100;

      // Stock Return for this year = Market + Alpha
      // This "bends" the market curve to fit the user's start/end points
      const periodReturn = marketRet + alpha;

      simPrice = simPrice / (1 + periodReturn);
    }

    // Add to aggregate portfolio
    for (let i = 0; i < yearsToShow; i++) {
      const val = stockPrices[i] * shares;
      if (!isNaN(val)) {
        portfolioValues[i] += val;
      }
    }
  });

  // Calculate Portfolio Index (Start at 100)
  const startValue = portfolioValues[0] || 1;
  const portfolioIndex = portfolioValues.map(v => (v / startValue) * 100);

  const dataPoints: ChartDataPoint[] = [];

  // Construct Data Points
  for (let i = 0; i < yearsToShow; i++) {
    const year = startYear + i;

    const infRate = relevantInflation.find(r => r.year === year)?.rate || 2.5;
    const benchRate = relevantBenchmark.find(r => r.year === year)?.return || 7.0;

    // Apply compound growth for subsequent years (i > 0)
    // Year 0 is the baseline (0% growth), subsequent years show actual returns
    if (i > 0) {
      inflationIndex = inflationIndex * (1 + (infRate / 100));
      benchmarkIndex = benchmarkIndex * (1 + (benchRate / 100));
    }

    // We plot "Percentage Growth" relative to the start date
    // Index 100 = 0% growth
    dataPoints.push({
      date: year.toString(),
      portfolio: parseFloat((portfolioIndex[i] - 100).toFixed(1)),
      benchmark: parseFloat((benchmarkIndex - 100).toFixed(1)),
      inflation: parseFloat((inflationIndex - 100).toFixed(1)),
    });
  }

  return dataPoints;
};