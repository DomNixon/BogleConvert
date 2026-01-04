/*
 * Copyright (c) 2026 Mid Michigan Connections LLC.
 * This file is part of BogleConvert.
 */

import { StockPosition } from '../types';

type FetchQuoteFn = (ticker: string) => Promise<any>;
type CalculateStatsFn = (stock: StockPosition) => StockPosition;
type MergePortfoliosFn = (current: StockPosition[], incoming: StockPosition[]) => StockPosition[];
type ProgressFn = (current: number, total: number) => void;

/**
 * Helper for cleaning numbers (strip currency, commas)
 */
const cleanNumber = (val: string): number => {
    if (!val) return 0;
    return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
};

/**
 * Parses a CSV file and fetches stock quotes to return a consolidated portfolio.
 */
export const parseAndFetchPortfolio = (
    file: File,
    fetchStockQuote: FetchQuoteFn,
    calculateStats: CalculateStatsFn,
    mergePortfolios: MergePortfoliosFn,
    onProgress?: ProgressFn
): Promise<StockPosition[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) {
                resolve([]);
                return;
            }

            const rows = text.split('\n');
            const rawStocks: StockPosition[] = [];

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

            if (onProgress) onProgress(0, validRows.length);

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

                            // Use wrapper for type compatibility if needed, but StockPosition matches
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
                if (onProgress) onProgress(Math.min(i + BATCH_SIZE, validRows.length), validRows.length);
            }

            // Consolidate the *imported* list first (handle duplicates within the CSV)
            // Passing empty array as initial to merge into
            const consolidatedImports = mergePortfolios([], rawStocks);

            resolve(consolidatedImports);
        };

        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
};
