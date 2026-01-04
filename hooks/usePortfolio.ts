/*
 * Copyright (c) 2026 Mid Michigan Connections LLC.
 * This file is part of BogleConvert.
 */

import { useState, useCallback } from 'react';
import { StockPosition } from '../types';
import { calculateStats, mergeStockIntoPortfolio, fetchStockQuote } from '../services/dataService';

export const usePortfolio = () => {
    const [portfolio, setPortfolio] = useState<StockPosition[]>([]);

    /**
     * Helper to recalculate portfolio weights based on current value
     */
    const recalculateWeights = useCallback((portfolioData: StockPosition[]): StockPosition[] => {
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
    }, []);

    /**
     * Updates a single field of a stock position
     */
    const updateStock = useCallback((index: number, field: keyof StockPosition, value: string | number) => {
        setPortfolio(prevPortfolio => {
            const newPortfolio = [...prevPortfolio];
            const stock = { ...newPortfolio[index] };

            // Type-safe field assignment
            switch (field) {
                case 'ticker':
                case 'name':
                case 'sector':
                case 'status':
                    if (typeof value === 'string') {
                        // @ts-ignore
                        stock[field] = value;
                    }
                    break;
                case 'avgCost':
                case 'currentPrice':
                case 'shares':
                case 'yearsHeld':
                case 'nominalReturn':
                case 'inflationAdjReturn':
                case 'weight':
                case 'cagr':
                    stock[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
                    break;
                case 'lastUpdated':
                    if (typeof value === 'string') stock[field] = value;
                    break;
            }

            // Recalculate returns if Average Cost or Years is updated
            if (field === 'avgCost' || field === 'yearsHeld') {
                const updatedStock = calculateStats(stock);
                Object.assign(stock, updatedStock);
            }

            newPortfolio[index] = stock;

            // Recalculate weights if shares changed
            if (field === 'shares') {
                return recalculateWeights(newPortfolio);
            }

            return newPortfolio;
        });
    }, [recalculateWeights]);

    /**
     * Handles adding a new empty row
     */
    const addStock = useCallback(() => {
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
        setPortfolio(prev => [...prev, newStock]);
    }, []);

    /**
     * Removes a position
     */
    const deleteStock = useCallback((index: number) => {
        setPortfolio(prev => {
            const filtered = prev.filter((_, i) => i !== index);
            return recalculateWeights(filtered);
        });
    }, [recalculateWeights]);

    /**
     * Handles ticker blur event to fetch quote and merge duplicates
     */
    const updateTicker = useCallback(async (index: number, ticker: string) => {
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
    }, [recalculateWeights]);

    /**
     * Bulk update handler
     */
    const updateRow = useCallback((index: number, data: Partial<StockPosition>) => {
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
    }, [recalculateWeights]);

    return {
        portfolio,
        setPortfolio,
        updateStock,
        addStock,
        deleteStock,
        updateTicker,
        updateRow,
        recalculateWeights
    };
};
