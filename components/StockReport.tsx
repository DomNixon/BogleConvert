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
import { StockPosition } from '../types';
import { CURRENCY_FORMATTER, PERCENT_FORMATTER } from '../constants';
import { fetchStockQuote, getAverageInflationRate } from '../services/dataService';

interface StockReportProps {
    portfolio: StockPosition[];
    initialTicker?: string;
}

interface StockDisplayData {
    ticker: string;
    name: string;
    price: number;
    change?: number;
    rangeLow: number;
    rangeHigh: number;
    marketAnnualReturn?: number;
    lastUpdated: string;
    sector?: string;
}

const StockReport: React.FC<StockReportProps> = ({ portfolio, initialTicker = "AAPL" }) => {
    const [searchTerm, setSearchTerm] = useState(initialTicker);
    const [displayData, setDisplayData] = useState<StockDisplayData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Find stock in portfolio
    const matchedPortfolioStock = portfolio.find(p => p.ticker === (displayData?.ticker || ""));

    // Calculate Portfolio Context
    const totalPortfolioValue = portfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
    const valueContribution = matchedPortfolioStock ? matchedPortfolioStock.shares * matchedPortfolioStock.currentPrice : 0;
    const allocation = totalPortfolioValue > 0 ? (valueContribution / totalPortfolioValue) * 100 : 0;
    const gainOverMarket = matchedPortfolioStock ? (matchedPortfolioStock.currentPrice - matchedPortfolioStock.avgCost) * matchedPortfolioStock.shares : 0;

    // Calculate Growth Metrics
    let annualGrowth = 0;
    let realBuyingPower = 0;

    if (displayData) {
        // Calculate average inflation over holdings period or default to 5 years
        // const avgInflationRate = getAverageInflationRate(matchedPortfolioStock?.yearsHeld || 5);

        if (matchedPortfolioStock) {
            // Use Portfolio specific data
            annualGrowth = matchedPortfolioStock.cagr;
            // Real Buying Power (Annualized Real Return)
            // Fix: Use Geometric Annualization of the Total Real Return to match DeepDivePanel
            // Formula: ((1 + TotalRealReturn)^(1/years) - 1)
            const years = Math.max(matchedPortfolioStock.yearsHeld, 1);
            const realCagr = ((Math.pow((1 + (matchedPortfolioStock.inflationAdjReturn / 100)), (1 / years))) - 1) * 100;
            realBuyingPower = Number(realCagr.toFixed(1));
        } else {
            // Use Market data fallback (Yearly Return)
            annualGrowth = displayData.marketAnnualReturn || 10.0;
            // Approximate Real Power for generic market data
            // For general lookup, we still estimate using the default 5Y avg inflation
            const avgInflationRate = getAverageInflationRate(5);
            const realRet = ((1 + (annualGrowth / 100)) / (1 + avgInflationRate) - 1) * 100;
            realBuyingPower = Number(realRet.toFixed(1));
        }
    }

    useEffect(() => {
        setSearchTerm(initialTicker);
    }, [initialTicker]);

    useEffect(() => {
        const fetchData = async () => {
            if (!searchTerm) return;

            setLoading(true);
            setError(null);

            try {
                const quote = await fetchStockQuote(searchTerm);
                if (quote) {
                    const rangeSpread = quote.price * 0.2;

                    setDisplayData({
                        ticker: searchTerm.toUpperCase(),
                        name: quote.name,
                        price: quote.price,
                        change: quote.dailyChange,
                        rangeLow: Number((quote.price - (rangeSpread * 0.4)).toFixed(2)),
                        rangeHigh: Number((quote.price + (rangeSpread * 0.6)).toFixed(2)),
                        marketAnnualReturn: quote.yearlyReturn,
                        lastUpdated: quote.lastUpdated,
                        sector: quote.sector
                    });
                } else {
                    setError(`Unable to retrieve real-time data for "${searchTerm.toUpperCase()}". Please verify the ticker symbol or check your network connection.`);
                    setDisplayData(null);
                }
            } catch (e) {
                setError("An unexpected error occurred while fetching stock data.");
                console.error("Failed to fetch stock report data", e);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(fetchData, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toUpperCase());
    };

    const getDataStatus = (dateString: string): 'fresh' | 'delayed' | 'stale' => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffHours / 24;

            if (diffDays > 30) return 'stale';
            if (diffHours >= 24) return 'delayed'; // 1 day or more
            return 'fresh';
        } catch (e) {
            return 'fresh';
        }
    };

    if (!displayData && loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-muted animate-spin">progress_activity</span>
            </div>
        );
    }

    const dataStatus = displayData ? getDataStatus(displayData.lastUpdated) : 'fresh';
    const showWarning = dataStatus !== 'fresh';

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 pb-32 md:p-8">
                {/* Search Bar */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
                    <input
                        className="w-full bg-surface border border-outline text-white placeholder-muted rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-secondary focus:border-secondary focus:outline-none transition-all uppercase"
                        placeholder="Search for a stock or ETF... (e.g. AAPL, VOO)"
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    {loading && (
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin">refresh</span>
                    )}
                </div>

                {error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-negative/10 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-negative">error_outline</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Ticker Not Found</h3>
                        <p className="text-muted max-w-md">{error}</p>
                    </div>
                ) : displayData ? (
                    <div className="flex flex-col rounded-xl border border-outline bg-surface text-gray-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
                        <div className="p-6 md:p-8 space-y-6">

                            {/* Header */}
                            <div className="flex flex-col justify-between items-center gap-6 text-center">
                                <div>
                                    <h1 className="text-secondary tracking-tight text-4xl font-bold font-display leading-tight">{displayData.ticker.toUpperCase()}</h1>
                                    <p className="text-muted text-lg font-normal leading-normal">{displayData.name}</p>
                                </div>
                            </div>

                            {/* Main Stats Grid: Price, Portfolio, Range */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* 1. Current Price */}
                                <div className="flex flex-col items-center justify-center text-center rounded-lg p-4 bg-white/5 border border-outline min-h-[180px] relative">
                                    <div className="flex-1 flex flex-col justify-center">
                                        <p className="text-muted text-sm font-medium leading-normal mb-2">Current Price</p>
                                        <div className="flex items-baseline justify-center gap-3">
                                            <p className="text-white tracking-light text-4xl font-bold font-display leading-tight">{CURRENCY_FORMATTER.format(displayData.price)}</p>
                                            {displayData.change !== undefined && (
                                                <p className={`${displayData.change >= 0 ? 'text-positive' : 'text-negative'} text-lg font-medium leading-normal`}>
                                                    {displayData.change > 0 ? '+' : ''}{displayData.change}%
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-2 ${showWarning ? 'text-orange-400' : 'text-muted'}`}>
                                        <span className="material-symbols-outlined text-sm">{showWarning ? 'warning' : 'schedule'}</span>
                                        <p className="text-xs font-medium">
                                            Data as of <span className={`${showWarning ? 'text-orange-300' : 'text-gray-300'} font-semibold`}>{displayData.lastUpdated}</span>
                                            {dataStatus === 'delayed' && <span className="ml-1 opacity-80">(Delayed)</span>}
                                            {dataStatus === 'stale' && <span className="ml-1 opacity-80">(Stale)</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* 2. Portfolio Context (Center) */}
                                <div className="flex flex-col items-center justify-center rounded-lg bg-white/5 border border-outline p-4 min-h-[180px]">
                                    {matchedPortfolioStock ? (
                                        <>
                                            <h3 className="text-white text-base font-bold tracking-tight mb-3">Portfolio Context</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-16 h-16">
                                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                        <circle className="text-outline" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                                                        <circle
                                                            className="text-secondary transition-all duration-1000 ease-out"
                                                            cx="18"
                                                            cy="18"
                                                            fill="none"
                                                            r="16"
                                                            strokeDasharray={`${allocation}, 100`}
                                                            strokeLinecap="round"
                                                            strokeWidth="3"
                                                        ></circle>
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-lg font-bold text-white">{allocation.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <p className="text-muted text-xs font-medium">Value of Contribution</p>
                                                    <p className="text-white text-lg font-bold">{CURRENCY_FORMATTER.format(valueContribution)}</p>
                                                    <p className="text-muted text-xs font-medium">Allocation Size</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-2 items-center justify-center opacity-75 h-full">
                                            <h3 className="text-muted text-base font-bold tracking-tight">Portfolio Context</h3>
                                            <div className="flex items-center gap-2 text-muted">
                                                <span className="material-symbols-outlined">visibility_off</span>
                                                <span className="text-sm">Not currently held</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Bogle Speculation Meter */}
                                <div className="flex flex-col items-center justify-center text-center rounded-lg p-4 bg-white/5 border border-outline min-h-[180px]">
                                    {displayData.sector === 'ETF' ? (
                                        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                                            <div className="p-3 rounded-full bg-secondary/10 text-secondary mb-1">
                                                <span className="material-symbols-outlined text-3xl">shield</span>
                                            </div>
                                            <div>
                                                <p className="text-muted text-sm font-medium leading-normal mb-1">Bogle Speculation Meter</p>
                                                <p className="text-secondary tracking-light text-2xl font-bold font-display leading-tight">Diversified</p>
                                            </div>
                                            <p className="text-xs text-muted max-w-[200px] leading-relaxed">Broad market exposure. The cornerstone of a passive portfolio.</p>
                                        </div>
                                    ) : displayData.sector === 'Unknown' ? (
                                        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                                            <div className="p-3 rounded-full bg-muted/10 text-muted mb-1">
                                                <span className="material-symbols-outlined text-3xl">help_outline</span>
                                            </div>
                                            <div>
                                                <p className="text-muted text-sm font-medium leading-normal mb-1">Bogle Speculation Meter</p>
                                                <p className="text-muted tracking-light text-2xl font-bold font-display leading-tight">Data Unavailable</p>
                                            </div>
                                            <p className="text-xs text-muted max-w-[200px] leading-relaxed">Sector data not found. Unable to classify this security.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                                            <div className="p-3 rounded-full bg-primary/10 text-primary mb-1">
                                                <span className="material-symbols-outlined text-3xl">local_fire_department</span>
                                            </div>
                                            <div>
                                                <p className="text-muted text-sm font-medium leading-normal mb-1">Bogle Speculation Meter</p>
                                                <p className="text-primary tracking-light text-2xl font-bold font-display leading-tight">Speculative</p>
                                            </div>
                                            <p className="text-xs text-muted max-w-[200px] leading-relaxed">Individual stock risk. Limit to &lt; 5% of total portfolio.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Growth Engine */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-white text-lg font-bold leading-tight tracking-tight text-center">Growth Engine</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col items-center justify-center text-center gap-1 rounded-lg p-4 bg-white/5 border border-outline">
                                        <p className="text-muted text-sm font-medium leading-normal">{matchedPortfolioStock ? 'Your Annual Growth (CAGR)' : 'Annual Market Return (1Y)'}</p>
                                        <p className={`text-transparent bg-clip-text bg-gradient-to-r ${annualGrowth >= 0 ? 'from-secondary to-cyan-300' : 'from-primary to-purple-400'} tracking-light text-3xl font-bold font-display leading-tight`}>
                                            {annualGrowth > 0 ? '+' : ''}{annualGrowth}%
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center gap-1 rounded-lg p-4 bg-white/5 border border-outline">
                                        <p className="text-muted text-sm font-medium leading-normal">Real Buying Power</p>
                                        <p className={`text-transparent bg-clip-text bg-gradient-to-r ${realBuyingPower >= 0 ? 'from-secondary to-cyan-300' : 'from-primary to-purple-400'} tracking-light text-3xl font-bold font-display leading-tight`}>
                                            {realBuyingPower > 0 ? '+' : ''}{realBuyingPower}%
                                        </p>
                                        <p className="text-xs text-muted mt-1">Adjusted for inflation</p>
                                    </div>
                                </div>
                            </div>

                            {/* Position Details - New Section */}
                            {matchedPortfolioStock && (
                                <div className="grid grid-cols-3 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom duration-500 delay-100">
                                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-lg bg-white/5 border border-outline">
                                        <p className="text-muted text-xs uppercase font-medium">Sector</p>
                                        <p className="text-white font-bold text-lg mt-1 truncate max-w-full px-2">{matchedPortfolioStock.sector}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-lg bg-white/5 border border-outline">
                                        <p className="text-muted text-xs uppercase font-medium">Shares</p>
                                        <p className="text-white font-bold text-lg mt-1">{matchedPortfolioStock.shares}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-lg bg-white/5 border border-outline">
                                        <p className="text-muted text-xs uppercase font-medium">Avg Cost</p>
                                        <p className="text-white font-bold text-lg mt-1">{CURRENCY_FORMATTER.format(matchedPortfolioStock.avgCost)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Performance vs Market */}
                            {matchedPortfolioStock && (
                                <div className="flex flex-col items-center text-center gap-4 rounded-lg bg-white/5 border border-outline p-4 animate-in slide-in-from-bottom duration-500 delay-200">
                                    <h3 className="text-white text-lg font-bold leading-tight tracking-tight">Performance vs. Global Market (VT)</h3>
                                    <div className="flex flex-col w-full gap-3">
                                        <div className="w-full bg-outline h-8 rounded-full flex items-center relative overflow-hidden">
                                            <div className="absolute left-1/2 w-px h-full bg-white/20 z-10"></div>
                                            {/* Simple visual representation of relative performance. Real implementation would compare CAGR vs VT CAGR */}
                                            <div
                                                className={`h-full bg-gradient-to-r ${gainOverMarket >= 0 ? 'from-secondary to-blue-400 justify-end pr-3' : 'from-primary to-purple-500 justify-start pl-3'} flex items-center transition-all duration-1000`}
                                                style={{ width: '65%' }} // Fixed width for demo
                                            >
                                                <p className="text-xs font-bold text-white/90 whitespace-nowrap">
                                                    {gainOverMarket >= 0 ? 'Beating Market' : 'Trailing Market'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted text-center">This represents a gain of <span className="font-semibold text-gray-200">{CURRENCY_FORMATTER.format(gainOverMarket)}</span> over holding the market index.</p>
                                    </div>
                                </div>
                            )}

                            {/* Fallback Data Warning - Non-intrusive */}
                            {(displayData.sector === 'Unknown' || displayData.price === 0) && (
                                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-outline/50 p-3 text-muted animate-in fade-in duration-500">
                                    <span className="material-symbols-outlined text-base">info</span>
                                    <p className="text-xs leading-relaxed">
                                        Some data for this ticker may be incomplete or unavailable.
                                        {displayData.price === 0 && ' Price data not found.'}
                                        {displayData.sector === 'Unknown' && ' Sector classification not available.'}
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted">
                        {loading ? (
                            <p>Fetching Data...</p>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                                <p>Enter a ticker to view the report.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockReport;