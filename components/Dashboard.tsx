import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, YAxis, CartesianGrid } from 'recharts';
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
    benchmark: 'VT' | 'VTI' | 'VOO';
    onBenchmarkChange: (b: 'VT' | 'VTI' | 'VOO') => void;
    onViewGuide: () => void;
    lastUpdated?: string | null;
}

// Internal Memoized Chart Component
// This isolation prevents the chart from re-rendering on every keystroke in the input table
// The chart only updates when `chartData` or `benchmark` explicitly change.
const DashboardChart = React.memo(({ chartData, benchmark, totalCost }: { chartData: ChartDataPoint[], benchmark: string, totalCost: number }) => {

    const gradientStops = useMemo(() => {
        if (!chartData || chartData.length < 2) return null;

        const stops = [];
        const lastIdx = chartData.length - 1;

        // Determine initial state (Above = Portfolio > Inflation)
        let isAbove = chartData[0].portfolio > chartData[0].inflation;

        // Helper: Blue (Secondary) if Above, Purple (Primary) if Below
        const getColor = (above: boolean) => above ? COLORS.secondary : COLORS.primary;

        let currentColor = getColor(isAbove);

        // Start Stop
        stops.push(<stop key="start" offset="0%" stopColor={currentColor} stopOpacity={1} />);

        for (let i = 0; i < lastIdx; i++) {
            const curr = chartData[i];
            const next = chartData[i + 1];

            const currDiff = curr.portfolio - curr.inflation;
            const nextDiff = next.portfolio - next.inflation;

            // Check for crossing: One is positive (>0), other is non-positive (<=0)
            // We treat 0 as "Below/Equal" for strict > check logic
            const currIsAbove = currDiff > 0;
            const nextIsAbove = nextDiff > 0;

            if (currIsAbove !== nextIsAbove) {
                // Calculate intersection point using linear interpolation
                // t = |y1| / (|y1| + |y2|)
                const range = Math.abs(currDiff) + Math.abs(nextDiff);
                const t = Math.abs(currDiff) / range;

                // Global offset for the chart (0 to 1)
                const globalOffset = (i + t) / lastIdx;

                // Add hard transition stops
                stops.push(<stop key={`stop-${i}-a`} offset={globalOffset} stopColor={currentColor} stopOpacity={1} />);

                // Switch color
                isAbove = !isAbove;
                currentColor = getColor(isAbove);

                stops.push(<stop key={`stop-${i}-b`} offset={globalOffset} stopColor={currentColor} stopOpacity={1} />);
            }
        }

        // End Stop
        stops.push(<stop key="end" offset="100%" stopColor={currentColor} stopOpacity={1} />);
        return stops;
    }, [chartData]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#131219] border border-[#23222f] rounded-xl shadow-2xl p-4 min-w-[240px] backdrop-blur-md">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">{label}</p>
                    <div className="flex flex-col gap-3">
                        {payload.map((entry: any, index: number) => {
                            // Determine color and display name
                            let color = entry.color;
                            let name = entry.name;
                            let isPortfolio = entry.dataKey === 'portfolio';
                            let isInflation = entry.dataKey === 'inflation';

                            // Calculate Value
                            const pctValue = entry.value;

                            if (isInflation) {
                                // Inflation Specific Logic
                                const currentIndex = chartData.findIndex(item => item.date === label);
                                const prevInflation = currentIndex > 0 ? chartData[currentIndex - 1].inflation : 0;
                                const periodDelta = pctValue - prevInflation;

                                const periodDrag = totalCost * (periodDelta / 100);
                                const totalDrag = totalCost * (pctValue / 100);

                                return (
                                    <div key={index} className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <div className="w-2 h-2 rounded-full border border-dashed border-red-400"></div>
                                            <span className="text-gray-300 text-sm font-medium">Inflation Impact</span>
                                        </div>
                                        <div className="flex flex-col pl-4 gap-1">
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <span className="text-sm text-gray-400 font-medium whitespace-nowrap">This Year</span>
                                                <div className="flex items-center gap-2 text-right">
                                                    <span className="text-sm font-bold text-white">{periodDelta.toFixed(1)}%</span>
                                                    <span className="text-sm font-medium text-red-400">
                                                        (-{CURRENCY_FORMATTER.format(periodDrag)})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Cumulative</span>
                                                <div className="flex items-center gap-2 text-right">
                                                    <span className="text-xs font-medium text-gray-400">{pctValue.toFixed(1)}%</span>
                                                    <span className="text-xs text-red-500/80 font-medium">
                                                        (-{CURRENCY_FORMATTER.format(totalDrag)})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Style Logic
                            let valueClass = 'text-gray-400';
                            let indicatorColor = color;

                            if (isPortfolio) {
                                indicatorColor = '#ffffff'; // White
                                valueClass = 'text-white';
                            } else if (entry.dataKey === 'benchmark') {
                                indicatorColor = '#34d399'; // Green (emerald-400)
                                valueClass = 'text-emerald-400';
                            }

                            const estimatedValue = totalCost * (1 + (pctValue / 100));

                            return (
                                <div key={index} className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicatorColor }}></div>
                                        <span className="text-gray-300 text-sm font-medium">{name}</span>
                                    </div>
                                    <div className="flex items-baseline justify-between pl-4">
                                        <span className={`text-lg font-bold font-display ${valueClass}`}>
                                            {pctValue > 0 ? '+' : ''}{pctValue}%
                                        </span>
                                        <span className={`text-sm font-medium ${isPortfolio ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {CURRENCY_FORMATTER.format(estimatedValue)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-[10px] text-gray-500 italic">
                            Values estimated based on current portfolio cost basis of {CURRENCY_FORMATTER.format(totalCost)}
                        </p>
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
        <div className="w-full bg-surface border border-outline rounded-xl p-6 shadow-xl relative overflow-hidden">
            {/* Legend */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                    <p className="text-sm text-neutral-300">Portfolio (Above Inflation)</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                    <p className="text-sm text-neutral-300">Portfolio (Below Inflation)</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.chart.benchmark }}></div>
                    <p className="text-sm text-neutral-300">Benchmark {benchmark}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-dashed border-emerald-400"></div>
                    <p className="text-sm text-neutral-300">Inflation</p>
                </div>
                <div className="group relative flex items-center ml-2 cursor-help">
                    <span className="material-symbols-outlined text-muted text-sm hover:text-white transition-colors">info</span>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-bg-dark border border-outline rounded-lg shadow-xl text-xs text-muted hidden group-hover:block z-50">
                        This chart shows a simplified projection of your portfolio's growth based on your holdings' total return and the benchmark's historical annual returns. It implies a constant performance gap and does not represent actual historical price movements.
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="100%" y2="0">
                                {gradientStops}
                            </linearGradient>
                            {/* Benchmark Gradient */}
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
                            tick={{ fill: '#ffffff', fontSize: 12 }} // White text for readability
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                            domain={['dataMin', 'dataMax']} // Auto-scale to fit data
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Benchmark Area */}
                        <Area
                            type="monotone"
                            dataKey="benchmark"
                            stroke={COLORS.chart.benchmark}
                            strokeWidth={2}
                            fill="url(#benchmarkGradient)"
                            name={`Benchmark ${benchmark}`}
                            animationDuration={300}
                        />
                        {/* Inflation Line */}
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
                        {/* Portfolio Line (Dynamic Color) */}
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
    lastUpdated
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
            <header className="flex flex-shrink-0 flex-col gap-4 border-b border-outline bg-surface p-6 md:flex-row md:items-center md:justify-between z-10">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Portfolio Dashboard</h1>
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
                    <div className="flex items-start gap-2 mt-1">
                        <p className="text-muted text-base">Track your real returns against inflation and the market.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="material-symbols-outlined text-sm text-muted">cloud</span>
                        <p className="text-xs text-muted">
                            Market data updated daily via BogleConvert Cloud.
                            {lastUpdated && <span className="text-secondary ml-1">Last Data Pull: {lastUpdated}</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 border border-outline"
                    >
                        <span className="material-symbols-outlined text-xl">upload_file</span>
                        Import CSV
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
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02]"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        Add Position
                    </button>
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
                            <div className="overflow-x-auto">
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
                        </div>

                        {/* Guide Hint */}
                        <div className="text-center pb-8">
                            <p className="text-muted text-sm">
                                Need help understanding the chart colors? <button onClick={onViewGuide} className="text-white hover:underline">Check out The Guide</button>.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Deep Dive Panel (Slide Over) */}
                {selectedStock && (
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
                )}
            </div>
        </div>
    );
};

export default Dashboard;