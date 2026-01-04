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

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, YAxis, CartesianGrid, TooltipProps } from 'recharts';
import { StockPosition, ChartDataPoint } from '../types';
import DeepDivePanel from './DeepDivePanel';
import { COLORS, CURRENCY_FORMATTER } from '../constants';

interface DashboardProps {
    portfolio: StockPosition[];
    chartData: ChartDataPoint[];
    onUpdateStock: (index: number, field: keyof StockPosition, value: string | number) => void;
    onUpdateRow: (index: number, data: Partial<StockPosition>) => void;
    onTickerBlur?: (index: number, ticker: string) => void;
    onDeleteRow: (index: number) => void;
    onViewReport: (ticker: string) => void;
    onAddRow: () => void;
    onBulkImport: (file: File) => void;
    onLoadDemo: () => void;
    benchmark: 'V T' | 'VTI' | 'VOO';
    onBenchmarkChange: (b: 'VT' | 'VTI' | 'VOO') => void;
    onViewGuide: () => void;
    lastUpdated?: string | null;
    importing?: boolean;
    importProgress?: { current: number; total: number };
    importError?: string | null;
}

// Internal Memoized Chart Component
// This isolation prevents the chart from re-rendering on every keystroke in the input table
// The chart only updates when `chartData` or `benchmark` explicitly change.
const DashboardChart = React.memo(({ chartData, benchmark, totalCost }: { chartData: ChartDataPoint[], benchmark: string, totalCost: number }) => {
    // View State
    const [viewMode, setViewMode] = useState<'percent' | 'real' | 'growth'>('percent');
    const [timeRange, setTimeRange] = useState<'max' | '5y' | '3y' | '1y'>('max');

    const processedData = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];

        let data = [...chartData];

        // 1. Filter by Time Range
        if (timeRange !== 'max') {
            const currentYear = new Date().getFullYear();
            // yearsToInclude: 5Y shows 5 years, 3Y shows 3 years, 1Y shows minimum 2 years for line chart
            const yearsToInclude = timeRange === '5y' ? 5 : timeRange === '3y' ? 3 : 2;
            // Calculate minYear to be inclusive of current year
            // Example: 2026 with 5Y filter -> minYear = 2026 - (5-1) = 2022
            // Shows: 2022, 2023, 2024, 2025, 2026 (5 data points)
            const minYear = currentYear - (yearsToInclude - 1);
            data = data.filter(d => parseInt(d.date) >= minYear);
        }

        // 2. Transform by View Mode
        // Re-baseline the data to 0 (or 10k) at the start of the filtered period
        if (data.length > 0) {
            const startNode = data[0];
            const startPortfolio = startNode.portfolio; // These are % growth from absolute inception
            const startBenchmark = startNode.benchmark;
            const startInflation = startNode.inflation;

            // Helper to get raw multiplier from the % string: 20% -> 1.20
            const getMult = (pct: number) => 1 + (pct / 100);

            // We need to chain link: Current Value = (Global_Index_Current / Global_Index_Start_Of_Window)
            // But we only have the Global Index relative to 100, so:
            // Val_Inv_Window = (1 + Global_Pct / 100) / (1 + Start_Pct / 100)

            // Base Multipliers for the WINDOW START
            const basePort = 1 + (startPortfolio / 100);
            const baseBench = 1 + (startBenchmark / 100);
            const baseInf = 1 + (startInflation / 100);

            data = data.map(d => {
                // Current Multipliers from GLOBAL START
                const currPort = 1 + (d.portfolio / 100);
                const currBench = 1 + (d.benchmark / 100);
                const currInf = 1 + (d.inflation / 100);

                // Windowed Multipliers (Growth since start of this view)
                const winPort = currPort / basePort;
                const winBench = currBench / baseBench;
                const winInf = currInf / baseInf;

                if (viewMode === 'growth') {
                    // Growth of $10,000
                    return {
                        ...d,
                        portfolio: parseFloat(((winPort * 10000).toFixed(0))),
                        benchmark: parseFloat(((winBench * 10000).toFixed(0))),
                        // Inflation shows only the cumulative drag (interest accrued), not the full 10K
                        inflation: parseFloat((((winInf - 1) * 10000).toFixed(0))),
                    };
                } else if (viewMode === 'real') {
                    // Real Return % (Purchasing Power)
                    // Real = (1+Nominal)/(1+Inflation) - 1
                    const realPort = (winPort / winInf) - 1;
                    const realBench = (winBench / winInf) - 1;

                    return {
                        ...d,
                        portfolio: parseFloat(((realPort * 100).toFixed(1))),
                        benchmark: parseFloat(((realBench * 100).toFixed(1))),
                        inflation: 0, // Baseline
                    };
                } else {
                    // Standard Percent Return in this window
                    return {
                        ...d,
                        portfolio: parseFloat(((winPort - 1) * 100).toFixed(1)),
                        benchmark: parseFloat(((winBench - 1) * 100).toFixed(1)),
                        inflation: parseFloat(((winInf - 1) * 100).toFixed(1)),
                    };
                }
            });
        }

        return data;
    }, [chartData, viewMode, timeRange]);


    const gradientStops = useMemo(() => {
        // If Real Return mode, we just check if Portfolio > 0 (since Inflation is 0)
        // If Standard mode, we check Portfolio > Inflation

        if (!processedData || processedData.length < 2) return null;

        const stops = [];
        const lastIdx = processedData.length - 1;
        const compareKey = viewMode === 'real' ? 0 : 'inflation';

        const getDiff = (item: ChartDataPoint): number => {
            if (viewMode === 'real') return item.portfolio; // > 0 is good
            if (viewMode === 'growth') return item.portfolio - item.inflation; // > Inflation line
            return item.portfolio - item.inflation;
        };

        // Determine initial state
        let isAbove = getDiff(processedData[0]) > 0;

        // Helper: Blue (Secondary) if Above, Purple (Primary) if Below
        const getColor = (above: boolean) => above ? COLORS.secondary : COLORS.primary;

        let currentColor = getColor(isAbove);

        // Start Stop
        stops.push(<stop key="start" offset="0%" stopColor={currentColor} stopOpacity={1} />);

        for (let i = 0; i < lastIdx; i++) {
            const curr = processedData[i];
            const next = processedData[i + 1];

            const currDiff = getDiff(curr);
            const nextDiff = getDiff(next);

            const currIsAbove = currDiff > 0;
            const nextIsAbove = nextDiff > 0;

            if (currIsAbove !== nextIsAbove) {
                // Calculate intersection
                const range = Math.abs(currDiff) + Math.abs(nextDiff);
                const t = Math.abs(currDiff) / range;
                const globalOffset = (i + t) / lastIdx;

                stops.push(<stop key={`stop-${i}-a`} offset={globalOffset} stopColor={currentColor} stopOpacity={1} />);
                isAbove = !isAbove;
                currentColor = getColor(isAbove);
                stops.push(<stop key={`stop-${i}-b`} offset={globalOffset} stopColor={currentColor} stopOpacity={1} />);
            }
        }

        stops.push(<stop key="end" offset="100%" stopColor={currentColor} stopOpacity={1} />);
        return stops;
    }, [processedData, viewMode]);

    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#131219] border border-[#23222f] rounded-xl shadow-2xl p-4 min-w-[240px] backdrop-blur-md">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">{label}</p>
                    <div className="flex flex-col gap-3">
                        {payload.map((entry, index: number) => {
                            let color = entry.color;
                            let name = entry.name;
                            let isPortfolio = entry.dataKey === 'portfolio';
                            let isInflation = entry.dataKey === 'inflation';
                            const value = entry.value || 0;

                            // Custom formatting based on mode
                            const formatValue = (val: number) => {
                                if (viewMode === 'growth') return CURRENCY_FORMATTER.format(val);
                                return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
                            };

                            if (isInflation && viewMode === 'real') {
                                // Don't show Inflation line tooltip in Real mode (it's flat 0)
                                return null;
                            }

                            // Inflation Item in Growth/Percentage Mode
                            if (isInflation) {
                                return (
                                    <div key={index} className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <div className="w-2 h-2 rounded-full border border-dashed border-red-400"></div>
                                            <span className="text-gray-300 text-sm font-medium">Inflation Limit</span>
                                        </div>
                                        <div className="pl-4">
                                            <span className="text-lg font-bold text-red-400/90">{formatValue(value)}</span>
                                        </div>
                                    </div>
                                );
                            }

                            let valueClass = 'text-gray-400';
                            let indicatorColor = color;

                            if (isPortfolio) {
                                indicatorColor = '#ffffff';
                                valueClass = 'text-white';
                            } else if (entry.dataKey === 'benchmark') {
                                indicatorColor = '#34d399';
                                valueClass = 'text-emerald-400';
                            }

                            // Calculate Alpha/Gap here for extra context
                            // Find the benchmark value in payload
                            const benchVal = payload.find((p) => p.dataKey === 'benchmark')?.value || 0;
                            const inflationVal = payload.find((p) => p.dataKey === 'inflation')?.value || 0;

                            let subText = null;
                            if (isPortfolio) {
                                if (viewMode === 'real') {
                                    // In real mode, value IS real return
                                    const alpha = value - benchVal; // Real Alpha
                                    subText = (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-500">Real Alpha</span>
                                            <span className={`text-xs font-bold ${alpha >= 0 ? 'text-secondary' : 'text-primary'}`}>
                                                {alpha > 0 ? '+' : ''}{alpha.toFixed(1)}%
                                            </span>
                                        </div>
                                    );
                                } else if (viewMode === 'percent') {
                                    const realReturn = value - inflationVal;
                                    subText = (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-500">Real Return</span>
                                            <span className={`text-xs font-bold ${realReturn >= 0 ? 'text-secondary' : 'text-primary'}`}>
                                                {realReturn > 0 ? '+' : ''}{realReturn.toFixed(1)}%
                                            </span>
                                        </div>
                                    );
                                }
                            }

                            return (
                                <div key={index} className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicatorColor }}></div>
                                        <span className="text-gray-300 text-sm font-medium">{name}</span>
                                    </div>
                                    <div className="flex flex-col pl-4">
                                        <span className={`text-lg font-bold font-display ${valueClass}`}>
                                            {formatValue(value)}
                                        </span>
                                        {subText}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!chartData || chartData.length === 0) {
        return (
            <div className="w-full h-[350px] bg-surface border border-outline rounded-xl flex items-center justify-center text-muted">
                Add positions to view chart
            </div>
        );
    }

    return (
        <div className="w-full bg-surface border border-outline rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-6">

            {/* Controls Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                        <p className="text-sm text-neutral-300">Winning</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                        <p className="text-sm text-neutral-300">Losing</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.chart.benchmark }}></div>
                        <p className="text-sm text-neutral-300">Benchmark</p>
                    </div>
                    {viewMode !== 'real' && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-dashed border-emerald-400"></div>
                            <p className="text-sm text-neutral-300">Inflation</p>
                        </div>
                    )}
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-black/20 p-1 rounded-lg border border-outline/50">
                        <button
                            onClick={() => setTimeRange('max')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === 'max' ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            Max
                        </button>
                        <button
                            onClick={() => setTimeRange('5y')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === '5y' ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            5Y
                        </button>
                        <button
                            onClick={() => setTimeRange('3y')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === '3y' ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            3Y
                        </button>
                    </div>
                    <div className="h-6 w-px bg-outline/50 mx-1"></div>
                    <div className="flex bg-black/20 p-1 rounded-lg border border-outline/50">
                        <button
                            onClick={() => setViewMode('percent')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'percent' ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-white'}`}
                            title="Nominal Return %"
                        >
                            %
                        </button>
                        <button
                            onClick={() => setViewMode('real')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'real' ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-white'}`}
                            title="Real Return (Purchasing Power)"
                        >
                            Real
                        </button>
                        <button
                            onClick={() => setViewMode('growth')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'growth' ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-white'}`}
                            title="Growth of $10k"
                        >
                            $10k
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="100%" y2="0">
                                {gradientStops}
                            </linearGradient>
                            <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.chart.benchmark} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={COLORS.chart.benchmark} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#23222f" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#8f8f9c"
                            tick={{ fill: '#8f8f9c', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#8f8f9c"
                            tick={{ fill: '#ffffff', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => viewMode === 'growth' ? `$${value / 1000}k` : `${value > 0 ? '+' : ''}${value}%`}
                            domain={['dataMin', 'dataMax']}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        <Area
                            type="monotone"
                            dataKey="benchmark"
                            stroke={COLORS.chart.benchmark}
                            strokeWidth={2}
                            fill="url(#benchmarkGradient)"
                            name={`Benchmark ${benchmark}`}
                            animationDuration={300}
                        />
                        {/* Inflation Line - Hidden in Real Mode usually, or flat 0 */}
                        {viewMode !== 'real' && (
                            <Area
                                type="monotone"
                                dataKey="inflation"
                                stroke={COLORS.chart.inflation}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="none"
                                name="Inflation"
                                animationDuration={300}
                            />
                        )}

                        {/* Zero Line for Real Return Mode context */}
                        {viewMode === 'real' && (
                            <Area
                                type="monotone"
                                dataKey="inflation" // Inflation is 0 in real mode
                                stroke={COLORS.chart.inflation}
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                fill="none"
                                name="Baseline (0%)"
                                animationDuration={300}
                            />
                        )}

                        <Area
                            type="monotone"
                            dataKey="portfolio"
                            stroke="url(#splitColor)"
                            strokeWidth={3}
                            fill="none"
                            name="Your Portfolio"
                            animationDuration={300}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});


const Dashboard: React.FC<DashboardProps> = ({
    portfolio,
    chartData,
    onUpdateStock,
    onUpdateRow,
    onTickerBlur,
    onDeleteRow,
    onViewReport,
    onAddRow,
    onBulkImport,
    onLoadDemo,
    benchmark,
    onBenchmarkChange,
    onViewGuide,
    lastUpdated,
    importing,
    importProgress,
    importError
}) => {
    const [selectedStock, setSelectedStock] = useState<StockPosition | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Ref for file input
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDeepDive = (stock: StockPosition) => {
        setSelectedStock(stock);
    };

    const closeDeepDive = () => {
        setSelectedStock(null);
    };

    // Drag and Drop Handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onBulkImport(e.dataTransfer.files[0]);
        }
    };

    const handleYearChange = (index: number, value: string) => {
        const numVal = parseFloat(value);
        const currentYear = new Date().getFullYear();
        const minStartYear = 2008;
        const maxAllowedYears = currentYear - minStartYear;

        if (!isNaN(numVal) && numVal > maxAllowedYears) {
            // Cap the value
            onUpdateStock(index, 'yearsHeld', maxAllowedYears);
            setToastMessage(`Historical data limited to ${minStartYear} (Benchmark Inception). Years adjusted to ${maxAllowedYears}.`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        } else {
            onUpdateStock(index, 'yearsHeld', value);
        }
    };

    const handlePaste = (e: React.ClipboardEvent, rowIndex: number) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');

        // Check if it's a row paste (tab or comma separated)
        if (pasteData.includes('\t') || pasteData.includes(',')) {
            const items = pasteData.split(/[\t,]/).map(item => item.trim());
            // Simple heuristic: Ticker, Cost, Shares, Years
            const updates: Partial<StockPosition> = {};

            if (items[0]) updates.ticker = items[0].toUpperCase();
            if (items[1] && !isNaN(parseFloat(items[1]))) updates.avgCost = parseFloat(items[1]);
            if (items[2] && !isNaN(parseFloat(items[2]))) updates.shares = parseFloat(items[2]);
            if (items[3] && !isNaN(parseFloat(items[3]))) {
                // Apply validation logic to pasted years
                let years = parseFloat(items[3]);
                const currentYear = new Date().getFullYear();
                if (years > (currentYear - 2008)) {
                    years = currentYear - 2008;
                    setToastMessage(`Data limited to 2008. Years adjusted to ${years}.`);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 5000);
                }
                updates.yearsHeld = years;
            }

            onUpdateRow(rowIndex, updates);
        } else {
            // Single Value Paste - fallback to standard behavior for the focused input
            // Note: React Controlled inputs usually handle simple paste natively, 
            // but we can intercept here if needed. 
            // For now, let's assume specific column paste isn't the target of this logic.
            const target = e.target as HTMLInputElement;
            const field = target.name as keyof StockPosition;
            if (field) {
                onUpdateStock(rowIndex, field, pasteData);
            }
        }
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden relative">
            {/* Header */}
            <header className="flex flex-shrink-0 flex-col gap-3 border-b border-outline bg-surface p-4 pt-safe pt-6 md:p-6 md:flex-row md:items-center md:justify-between z-10 sticky top-0 md:static">
                {/* Mobile Top Row: Data Text (Left) + Title (Right) */}
                <div className="flex justify-between items-center md:hidden w-full">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-muted">cloud</span>
                        <p className="text-[10px] text-muted">
                            Data updated daily.
                            {lastUpdated && <span className="text-secondary ml-1 inline">Last: {lastUpdated}</span>}
                        </p>
                    </div>
                    <h1 className="text-xl font-bold font-display tracking-tight text-white">Portfolio</h1>
                </div>

                {/* Desktop Left Side */}
                <div className="hidden md:flex flex-col gap-2">
                    <div className="flex items-center justify-start gap-3">
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Portfolio</h1>
                        <div className="relative">
                            <select
                                value={benchmark}
                                onChange={(e) => onBenchmarkChange(e.target.value as 'VT' | 'VTI' | 'VOO')}
                                className="appearance-none bg-white/5 border border-outline text-white text-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer hover:bg-white/10 transition-colors font-medium"
                            >
                                <option value="VT" className="bg-bg-dark text-white">Global (VT)</option>
                                <option value="VTI" className="bg-bg-dark text-white">US Total (VTI)</option>
                                <option value="VOO" className="bg-bg-dark text-white">S&P 500 (VOO)</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-muted">cloud</span>
                        <p className="text-xs text-muted">
                            Data updated daily.
                            {lastUpdated && <span className="text-secondary ml-1">Last: {lastUpdated}</span>}
                        </p>
                    </div>
                </div>

                {/* Controls Row (Mobile: 3 cols, Desktop: Flex) */}
                <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-3 w-full md:w-auto">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-lg bg-white/5 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 border border-outline w-full md:w-auto"
                        title="Import CSV"
                    >
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        <span className="hidden md:inline">Import CSV</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv,.txt"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                onBulkImport(e.target.files[0]);
                            }
                        }}
                    />

                    <button
                        onClick={onAddRow}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] w-full md:w-auto"
                        title="Add Position"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span className="hidden md:inline">Add Position</span>
                    </button>

                    {/* Mobile-Only Benchmark Selector (3rd Button Slot) */}
                    <div className="relative md:hidden w-full h-full">
                        <select
                            value={benchmark}
                            onChange={(e) => onBenchmarkChange(e.target.value as 'VT' | 'VTI' | 'VOO')}
                            className="appearance-none bg-white/5 border border-outline text-white text-[10px] rounded-lg pl-2 pr-6 py-2 h-full w-full focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer hover:bg-white/10 transition-colors font-medium flex items-center"
                        >
                            <option value="VT" className="bg-bg-dark text-white">Global (VT)</option>
                            <option value="VTI" className="bg-bg-dark text-white">US Total (VTI)</option>
                            <option value="VOO" className="bg-bg-dark text-white">S&P 500 (VOO)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">expand_more</span>
                    </div>
                </div>
            </header>

            {/* Toast Notification */}
            {showToast && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 backdrop-blur-md">
                        <span className="material-symbols-outlined text-amber-400">warning</span>
                        <span className="text-sm font-medium">{toastMessage}</span>
                        <button onClick={() => setShowToast(false)} className="hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                </div>
            )}

            {/* Import Progress Modal */}
            {importing && importProgress && importProgress.total > 0 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
                    <div className="bg-surface border border-outline text-white px-6 py-4 rounded-lg shadow-2xl backdrop-blur-md min-w-[320px]">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="material-symbols-outlined text-secondary animate-spin">progress_activity</span>
                            <span className="text-sm font-semibold">Importing Portfolio...</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted">
                                <span>Progress</span>
                                <span>{importProgress.current} / {importProgress.total}</span>
                            </div>
                            <div className="w-full bg-bg-dark rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-secondary transition-all duration-300"
                                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Error/Success Display */}
            {!importing && importError && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
                    <div className="bg-surface border border-outline px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 backdrop-blur-md">
                        <span className="material-symbols-outlined text-amber-400">info</span>
                        <span className="text-sm text-white">{importError}</span>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">


                        {/* Chart Section */}
                        {/* Calculate total investment for tooltip estimates */}
                        <DashboardChart
                            chartData={chartData}
                            benchmark={benchmark}
                            totalCost={portfolio.reduce((sum, p) => sum + (p.avgCost * p.shares), 0)}
                        />

                        {/* Data Table */}
                        <div
                            className={`flex flex-col rounded-xl border-2 bg-surface shadow-sm transition-colors ${dragActive ? 'border-primary border-dashed bg-primary/5' : 'border-outline'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-left">
                                    <thead className="border-b border-outline bg-bg-dark/50">
                                        <tr>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Stock Ticker</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Avg Cost</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Shares</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Years Held</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted text-right">Nominal Return</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted text-right">Real Return</th>
                                            <th className="p-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline">
                                        {portfolio.map((stock, index) => (
                                            <tr key={index} className="group transition-colors hover:bg-white/5">
                                                <td className="p-3">
                                                    <div className="flex flex-col">
                                                        <input
                                                            type="text"
                                                            placeholder="Ticker"
                                                            value={stock.ticker}
                                                            name="ticker"
                                                            onChange={(e) => onUpdateStock(index, 'ticker', e.target.value)}
                                                            onBlur={(e) => onTickerBlur && onTickerBlur(index, e.target.value)}
                                                            onPaste={(e) => handlePaste(e, index)}
                                                            className="w-24 bg-transparent font-bold text-white placeholder-muted focus:outline-none uppercase"
                                                        />
                                                        <span className="text-xs text-muted truncate max-w-[120px]">{stock.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">$</span>
                                                        <input
                                                            type="number"
                                                            value={stock.avgCost || ''}
                                                            name="avgCost"
                                                            onChange={(e) => onUpdateStock(index, 'avgCost', parseFloat(e.target.value))}
                                                            className="w-36 rounded-md bg-bg-dark border border-transparent focus:border-secondary pl-5 pr-2 py-1.5 text-white placeholder-muted focus:outline-none transition-colors"
                                                            min="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={stock.shares || ''}
                                                        name="shares"
                                                        onChange={(e) => onUpdateStock(index, 'shares', parseFloat(e.target.value))}
                                                        className="w-32 rounded-md bg-bg-dark border border-transparent focus:border-secondary px-2 py-1.5 text-white placeholder-muted focus:outline-none transition-colors"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={stock.yearsHeld || ''}
                                                        name="yearsHeld"
                                                        onChange={(e) => handleYearChange(index, e.target.value)}
                                                        className="w-20 rounded-md bg-bg-dark border border-transparent focus:border-secondary px-2 py-1.5 text-white placeholder-muted focus:outline-none transition-colors"
                                                        min="0"
                                                        max="50"
                                                        step="0.5"
                                                    />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`font-medium ${stock.nominalReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                            {stock.nominalReturn > 0 ? '+' : ''}{stock.nominalReturn}%
                                                        </span>
                                                        <span className="text-xs text-muted">{CURRENCY_FORMATTER.format((stock.currentPrice - stock.avgCost) * stock.shares)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={`font-bold ${stock.inflationAdjReturn >= 0 ? 'text-secondary' : 'text-primary'}`}>
                                                            {stock.inflationAdjReturn > 0 ? '+' : ''}{stock.inflationAdjReturn}%
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeepDive(stock)}
                                                            className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors"
                                                            title="Deep Dive"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => onDeleteRow(index)}
                                                        className="text-muted opacity-0 group-hover:opacity-100 hover:text-negative transition-all"
                                                        title="Remove"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {portfolio.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-muted">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <span className="material-symbols-outlined text-4xl opacity-50">table_rows</span>
                                                        <p>Your portfolio is empty. Add a position manually or drag & drop a CSV.</p>
                                                        <div className="flex gap-4">
                                                            <button onClick={onAddRow} className="text-secondary hover:underline text-sm">Add First Position</button>
                                                            <button onClick={onLoadDemo} className="text-muted hover:text-white hover:underline text-sm">Load Demo Portfolio</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="flex flex-col gap-3 md:hidden p-3">
                                {portfolio.map((stock, index) => (
                                    <div key={index} className="bg-white/5 rounded-lg p-3 border border-outline flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={stock.ticker}
                                                        onChange={(e) => onUpdateStock(index, 'ticker', e.target.value)}
                                                        onBlur={(e) => onTickerBlur && onTickerBlur(index, e.target.value)}
                                                        className="bg-transparent font-bold text-lg text-white w-20 focus:outline-none uppercase"
                                                    />
                                                    <span className="text-xs text-muted truncate max-w-[100px]">{stock.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDeepDive(stock)} className="p-1.5 bg-white/5 rounded-md text-muted hover:text-white">
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                <button onClick={() => onDeleteRow(index)} className="p-1.5 bg-negative/10 rounded-md text-negative hover:bg-negative/20">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="flex flex-col gap-1 p-2 bg-black/20 rounded">
                                                <span className="text-[10px] text-muted uppercase">Avg Cost</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        value={stock.avgCost || ''}
                                                        onChange={(e) => onUpdateStock(index, 'avgCost', parseFloat(e.target.value))}
                                                        className="bg-transparent w-full focus:outline-none font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-2 bg-black/20 rounded text-center">
                                                <span className="text-[10px] text-muted uppercase w-full">Shares</span>
                                                <input
                                                    type="number"
                                                    value={stock.shares || ''}
                                                    onChange={(e) => onUpdateStock(index, 'shares', parseFloat(e.target.value))}
                                                    className="bg-transparent w-full focus:outline-none font-mono text-center"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 p-2 bg-black/20 rounded text-right">
                                                <span className="text-[10px] text-muted uppercase w-full">Years</span>
                                                <input
                                                    type="number"
                                                    value={stock.yearsHeld || ''}
                                                    onChange={(e) => handleYearChange(index, e.target.value)}
                                                    className="bg-transparent w-full focus:outline-none font-mono text-right"
                                                    step="0.5"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted uppercase">Real Return</span>
                                                <span className={`font-bold ${stock.inflationAdjReturn >= 0 ? 'text-secondary' : 'text-primary'}`}>
                                                    {stock.inflationAdjReturn > 0 ? '+' : ''}{stock.inflationAdjReturn}%
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-muted uppercase">Value</span>
                                                <span className="font-mono text-white">
                                                    {CURRENCY_FORMATTER.format((stock.currentPrice * stock.shares))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {portfolio.length === 0 && (
                                    <div className="text-center py-8 text-muted flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-3xl opacity-50">toc</span>
                                        <p className="text-sm">No positions found.</p>
                                        <button onClick={onAddRow} className="text-secondary text-sm font-medium">Add Position</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guide Hint */}
                        <div className="text-center pb-24 md:pb-8">
                            <p className="text-muted text-sm">
                                Need help understanding the chart colors? <button onClick={onViewGuide} className="text-white hover:underline">Check out The Guide</button>.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Deep Dive Panel (Slide Over) */}
                {
                    selectedStock && (
                        <div className="absolute inset-0 z-20 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeDeepDive}>
                            <div onClick={(e) => e.stopPropagation()} className="h-full">
                                <DeepDivePanel
                                    stock={selectedStock}
                                    onClose={closeDeepDive}
                                    onViewReport={(ticker) => {
                                        closeDeepDive();
                                        onViewReport(ticker);
                                    }}
                                />
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default Dashboard;