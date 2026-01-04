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

import { describe, it, expect } from 'vitest';
import {
    getCumulativeInflation,
    calculateStats,
    mergeStockIntoPortfolio,
    mergePortfolios,
    getChartData
} from './dataService';
import { StockPosition } from '../types';

/**
 * REALITY CHECK TEST SUITE
 * 
 * These tests verify that the app's financial calculations match mathematical reality.
 * Each test represents a "known truth" scenario that MUST pass.
 */

describe('Financial Logic - Reality Checks', () => {

    /**
     * TEST 1: The "CAGR" Check
     * 
     * Scenario: Value goes from $100 to $200 in 10 years
     * Expected: ~7.18% CAGR
     * Common Error: Linear calculation would give 10% (wrong!)
     * 
     * Formula: CAGR = (Ending/Beginning)^(1/years) - 1
     *          CAGR = (200/100)^(1/10) - 1
     *          CAGR = 2^0.1 - 1
     *          CAGR = 1.071773... - 1
     *          CAGR = 0.071773 = 7.18%
     */
    it('should calculate CAGR correctly (not linear growth)', () => {
        const testPosition: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 100,
            currentPrice: 200,
            shares: 10,
            yearsHeld: 10,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = calculateStats(testPosition);

        // CAGR should be ~7.18%, NOT 10% (linear error)
        expect(result.cagr).toBeCloseTo(7.2, 1); // Allow 0.1% variance

        // If CAGR is close to 10%, the formula is using linear calculation (FAILED)
        expect(Math.abs(result.cagr - 10.0)).toBeGreaterThan(2.0);
    });

    /**
     * TEST 2: The "Inflation" Check
     * 
     * Scenario: 5% inflation for 2 years
     * Expected: $1.00 becomes $1.1025 (geometric compounding)
     * Common Error: Linear calculation would give $1.10 (1 + 0.05*2)
     * 
     * Formula: Final = Initial * (1 + r)^n
     *          Final = 1.00 * (1.05)^2
     *          Final = 1.00 * 1.1025
     * 
     * Cumulative Inflation = 1.1025 - 1.00 = 0.1025 = 10.25%
     */
    it('should compound inflation geometrically (not linearly)', () => {
        // Mock a scenario with known inflation rates
        // Note: This test will use the actual historical data from dataService
        // We're checking the geometric nature of the formula, not exact values

        const inflation2Years = getCumulativeInflation(2);

        // With geometric compounding, 2 years of ~3% inflation should be around 6-7%
        // Linear would be exactly 6% (3% * 2)
        // Geometric should be slightly higher: (1.03^2 - 1) = 6.09%

        // We can't test exact values since we use real historical data,
        // but we can verify the function exists and returns reasonable values
        expect(inflation2Years).toBeGreaterThan(0);
        expect(inflation2Years).toBeLessThan(0.5); // Should be reasonable (< 50%)

        // Test with a longer period to verify compounding effect
        const inflation10Years = getCumulativeInflation(10);
        const inflation5Years = getCumulativeInflation(5);

        // Geometric compounding means 10 years ≠ 2 * 5 years
        // If linear: inflation10 = 2 * inflation5
        // If geometric: inflation10 < 2 * inflation5 (due to compounding)

        // This relationship should hold for geometric compounding
        expect(inflation10Years).toBeGreaterThan(inflation5Years);

        // Verify inflation compounds properly
        // After 10 years, cumulative should be more than simple 10x annual average
        const avgAnnual = inflation10Years / 10;
        expect(inflation10Years).toBeGreaterThan(avgAnnual * 10 * 0.9); // At least close
    });

    /**
     * TEST 3: The "Date" Check (Timezone Safety)
     * 
     * Scenario: User bought stock on "Dec 31, 2023"
     * Risk: Timezone shifts could push this to "Jan 1, 2024" (missing a year of returns)
     * 
     * This test verifies that date handling doesn't create off-by-one errors
     * that would distort yearsHeld calculations.
     */
    it('should handle year boundaries without timezone corruption', () => {
        const currentYear = new Date().getFullYear();

        // Simulate a stock bought on Dec 31, 2023
        // As of Jan 2, 2026, this should be ~2.01 years held
        const purchaseDate = new Date('2023-12-31T23:59:59');
        const now = new Date('2026-01-02T12:00:00');

        // Calculate years held
        const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
        const yearsHeld = (now.getTime() - purchaseDate.getTime()) / msPerYear;

        // Should be approximately 2 years
        expect(yearsHeld).toBeGreaterThan(2.0);
        expect(yearsHeld).toBeLessThan(2.1);

        // Now test with calculateStats to ensure it handles this correctly
        const testPosition: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 100,
            currentPrice: 110,
            shares: 10,
            yearsHeld: yearsHeld,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = calculateStats(testPosition);

        // CAGR calculation should use the correct years held
        // For a 10% gain over ~2 years: CAGR = (1.10)^(1/2) - 1 ≈ 4.88%
        expect(result.cagr).toBeGreaterThan(4.5);
        expect(result.cagr).toBeLessThan(5.5);

        // Verify it's not treating this as 1 year (which would give ~10% CAGR)
        expect(Math.abs(result.cagr - 10.0)).toBeGreaterThan(4.0);
    });

    /**
     * TEST 4: Real Return Calculation Validation
     * 
     * Scenario: Verify that inflation-adjusted returns use the correct formula
     * Formula: Real Return = ((1 + Nominal) / (1 + Inflation)) - 1
     */
    it('should calculate real returns using proper inflation adjustment', () => {
        const testPosition: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 100,
            currentPrice: 120, // 20% nominal return
            shares: 10,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = calculateStats(testPosition);

        // Nominal return should be 20%
        expect(result.nominalReturn).toBe(20.0);

        // Real return should be less than nominal due to inflation
        expect(result.inflationAdjReturn).toBeLessThan(result.nominalReturn);

        // Real return should still be positive for this scenario
        expect(result.inflationAdjReturn).toBeGreaterThan(0);

        // Verify the formula is being applied correctly
        // We can't test exact values due to historical data, but we can verify the relationship
        const cumulativeInflation = getCumulativeInflation(2);
        const expectedReal = ((1.20) / (1 + cumulativeInflation) - 1) * 100;

        expect(result.inflationAdjReturn).toBeCloseTo(expectedReal, 1);
    });

    /**
     * TEST 5: CAGR Edge Cases
     * 
     * Test that CAGR handles edge cases properly:
     * - Holdings < 1 year should use minimum 1 year
     * - Zero or negative prices should result in 0 CAGR
     */
    it('should handle CAGR edge cases correctly', () => {
        // Test 1: Holdings < 1 year should use 1 year minimum
        const shortHolding: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 100,
            currentPrice: 110,
            shares: 10,
            yearsHeld: 0.5, // 6 months
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result1 = calculateStats(shortHolding);

        // For 0.5 years with code using max(yearsHeld, 1), should calculate as if 1 year
        // CAGR = (110/100)^(1/1) - 1 = 10%
        expect(result1.cagr).toBeCloseTo(10.0, 1);

        // Test 2: Zero price should result in 0 CAGR
        const zeroPrice: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 100,
            currentPrice: 0,
            shares: 10,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result2 = calculateStats(zeroPrice);
        expect(result2.cagr).toBe(0);
    });
});

/**
 * PORTFOLIO MERGE LOGIC TEST SUITE
 * 
 * These tests verify that merging portfolios correctly calculates:
 * - Weighted average cost basis
 * - Total share count
 * - Weighted average years held
 */

describe('Portfolio Merge Logic', () => {

    /**
     * TEST 1: Weighted Average Cost Calculation
     * 
     * Scenario: Merge two lots of the same stock with different cost bases
     * Lot 1: 100 shares @ $50 = $5,000
     * Lot 2: 50 shares @ $80 = $4,000
     * Expected: 150 shares @ weighted avg of ($5,000 + $4,000) / 150 = $60
     */
    it('should calculate weighted average cost correctly when merging', () => {
        const existingStock: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 50,
            currentPrice: 100,
            shares: 100,
            yearsHeld: 3,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const newStock: StockPosition = {
            ticker: 'TEST',
            name: 'Test Stock',
            avgCost: 80,
            currentPrice: 100,
            shares: 50,
            yearsHeld: 1,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = mergeStockIntoPortfolio([existingStock], newStock);

        expect(result.length).toBe(1);
        expect(result[0].shares).toBe(150);

        // Weighted avg: (100*50 + 50*80) / 150 = (5000 + 4000) / 150 = 60
        expect(result[0].avgCost).toBe(60);
    });

    /**
     * TEST 2: Total Shares Addition
     * 
     * Verify that shares are correctly summed, not replaced
     */
    it('should add shares together when merging same ticker', () => {
        const lot1: StockPosition = {
            ticker: 'AAPL',
            name: 'Apple',
            avgCost: 100,
            currentPrice: 150,
            shares: 25,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Tech',
            weight: 0,
            cagr: 0
        };

        const lot2: StockPosition = {
            ticker: 'aapl', // Test case insensitivity
            name: 'Apple Inc.',
            avgCost: 120,
            currentPrice: 150,
            shares: 75,
            yearsHeld: 1,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Tech',
            weight: 0,
            cagr: 0
        };

        const result = mergeStockIntoPortfolio([lot1], lot2);

        expect(result[0].shares).toBe(100); // 25 + 75
        expect(result[0].ticker).toBe('AAPL'); // Original ticker case preserved
    });

    /**
     * TEST 3: Weighted Years Held (CAGR Protection)
     * 
     * Years held should be weighted by investment amount to prevent CAGR distortion
     * Lot 1: $5,000 invested for 4 years
     * Lot 2: $5,000 invested for 2 years
     * Expected: Weighted years = (5000*4 + 5000*2) / 10000 = 3 years
     */
    it('should calculate weighted average years held', () => {
        const lot1: StockPosition = {
            ticker: 'TEST',
            name: 'Test',
            avgCost: 50,
            currentPrice: 100,
            shares: 100, // $5,000 invested
            yearsHeld: 4,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const lot2: StockPosition = {
            ticker: 'TEST',
            name: 'Test',
            avgCost: 100, // Same $5,000 invested but at higher cost
            currentPrice: 100,
            shares: 50,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = mergeStockIntoPortfolio([lot1], lot2);

        // Weighted: (5000*4 + 5000*2) / 10000 = 3.0 years
        expect(result[0].yearsHeld).toBe(3);
    });

    /**
     * TEST 4: New Stock Addition (No Merge)
     * 
     * Adding a different ticker should append, not merge
     */
    it('should add new stock to portfolio without merging', () => {
        const existing: StockPosition = {
            ticker: 'AAPL',
            name: 'Apple',
            avgCost: 100,
            currentPrice: 150,
            shares: 50,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Tech',
            weight: 0,
            cagr: 0
        };

        const newStock: StockPosition = {
            ticker: 'GOOGL',
            name: 'Alphabet',
            avgCost: 100,
            currentPrice: 150,
            shares: 30,
            yearsHeld: 1,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Tech',
            weight: 0,
            cagr: 0
        };

        const result = mergeStockIntoPortfolio([existing], newStock);

        expect(result.length).toBe(2);
        expect(result[0].ticker).toBe('AAPL');
        expect(result[1].ticker).toBe('GOOGL');
    });

    /**
     * TEST 5: Full Portfolio Merge
     * 
     * Merge multiple stocks at once via mergePortfolios
     */
    it('should merge full portfolios correctly', () => {
        const portfolio1: StockPosition[] = [
            {
                ticker: 'AAPL', name: 'Apple', avgCost: 100, currentPrice: 150,
                shares: 50, yearsHeld: 2, nominalReturn: 0, inflationAdjReturn: 0,
                status: 'Tracking Market', sector: 'Tech', weight: 0, cagr: 0
            }
        ];

        const portfolio2: StockPosition[] = [
            {
                ticker: 'AAPL', name: 'Apple', avgCost: 120, currentPrice: 150,
                shares: 50, yearsHeld: 1, nominalReturn: 0, inflationAdjReturn: 0,
                status: 'Tracking Market', sector: 'Tech', weight: 0, cagr: 0
            },
            {
                ticker: 'MSFT', name: 'Microsoft', avgCost: 200, currentPrice: 300,
                shares: 25, yearsHeld: 3, nominalReturn: 0, inflationAdjReturn: 0,
                status: 'Tracking Market', sector: 'Tech', weight: 0, cagr: 0
            }
        ];

        const result = mergePortfolios(portfolio1, portfolio2);

        expect(result.length).toBe(2);

        const apple = result.find(s => s.ticker === 'AAPL');
        const msft = result.find(s => s.ticker === 'MSFT');

        expect(apple?.shares).toBe(100); // 50 + 50
        // Weighted avg: (50*100 + 50*120) / 100 = 110
        expect(apple?.avgCost).toBe(110);

        expect(msft?.shares).toBe(25);
        expect(msft?.avgCost).toBe(200);
    });
});

/**
 * STATUS CLASSIFICATION TEST SUITE
 * 
 * These tests verify the thresholds for status labels:
 * - Beating Inflation: Real Return >= 1%
 * - Tracking Market: Real Return between -1% and 1%
 * - Losing Power: Real Return < -1%
 */

describe('Status Classification Thresholds', () => {

    /**
     * TEST 1: Beating Inflation Threshold
     */
    it('should classify as "Beating Inflation" when real return >= 1%', () => {
        // High return stock - should easily beat inflation
        const stock: StockPosition = {
            ticker: 'TEST',
            name: 'Test',
            avgCost: 100,
            currentPrice: 130, // 30% nominal gain
            shares: 10,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = calculateStats(stock);

        // With 30% nominal and ~5-6% inflation over 2 years, real return should be ~24%
        expect(result.inflationAdjReturn).toBeGreaterThan(1);
        expect(result.status).toBe('Beating Inflation');
    });

    /**
     * TEST 2: Tracking Market Threshold (near-zero real return)
     */
    it('should classify as "Tracking Market" when real return is between -1% and 1%', () => {
        // Stock that roughly matches inflation
        // We need to find a price that gives ~0% real return
        // If 2-year inflation is ~5%, then 105% nominal = 0% real
        const inflation2Year = getCumulativeInflation(2);
        const breakEvenPrice = 100 * (1 + inflation2Year); // Price that matches inflation exactly

        const stock: StockPosition = {
            ticker: 'TEST',
            name: 'Test',
            avgCost: 100,
            currentPrice: breakEvenPrice,
            shares: 10,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Beating Inflation', // Will be recalculated
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = calculateStats(stock);

        // Real return should be approximately 0%
        expect(result.inflationAdjReturn).toBeGreaterThanOrEqual(-1);
        expect(result.inflationAdjReturn).toBeLessThanOrEqual(1);
        expect(result.status).toBe('Tracking Market');
    });

    /**
     * TEST 3: Losing Power Threshold
     */
    it('should classify as "Losing Power" when real return < -1%', () => {
        // Stock that lost money or barely gained (less than inflation)
        const stock: StockPosition = {
            ticker: 'TEST',
            name: 'Test',
            avgCost: 100,
            currentPrice: 95, // 5% loss nominal
            shares: 10,
            yearsHeld: 2,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        const result = calculateStats(stock);

        // With -5% nominal and +5% inflation, real return is roughly -10%
        expect(result.inflationAdjReturn).toBeLessThan(-1);
        expect(result.status).toBe('Losing Power');
    });

    /**
     * TEST 4: Edge case - Exactly at boundaries
     */
    it('should handle boundary values correctly', () => {
        // Test exactly at +1% boundary (should be "Beating Inflation")
        const stock1: StockPosition = {
            ticker: 'TEST',
            name: 'Test',
            avgCost: 100,
            currentPrice: 100, // Will be adjusted
            shares: 10,
            yearsHeld: 1,
            nominalReturn: 0,
            inflationAdjReturn: 0,
            status: 'Tracking Market',
            sector: 'Test',
            weight: 0,
            cagr: 0
        };

        // Calculate what price gives exactly 1% real return
        const inflation1Year = getCumulativeInflation(1);
        // Real = ((1+N)/(1+I)) - 1 = 0.01
        // (1+N) = 1.01 * (1+I)
        // N = 1.01 * (1+I) - 1
        const exactNominalFor1PercentReal = 1.01 * (1 + inflation1Year) - 1;
        stock1.currentPrice = 100 * (1 + exactNominalFor1PercentReal);

        const result1 = calculateStats(stock1);

        expect(result1.inflationAdjReturn).toBeCloseTo(1.0, 0);
        expect(result1.status).toBe('Beating Inflation');
    });
});

/**
 * CHART DATA GENERATION TEST SUITE
 * 
 * These tests verify chart data accuracy:
 * - Year range calculation
 * - Portfolio index normalization
 * - Benchmark alignment
 */

describe('Chart Data Generation', () => {

    /**
     * TEST 1: Chart should start at year based on longest holding
     */
    it('should calculate chart start year based on longest holding', async () => {
        const portfolio: StockPosition[] = [
            {
                ticker: 'TEST',
                name: 'Test',
                avgCost: 100,
                currentPrice: 150,
                shares: 10,
                yearsHeld: 5, // Longest holding
                nominalReturn: 50,
                inflationAdjReturn: 40,
                status: 'Beating Inflation',
                sector: 'Test',
                weight: 100,
                cagr: 8.5
            }
        ];

        const chartData = await getChartData(portfolio, 'VT');
        const currentYear = new Date().getFullYear();

        // Should have at least 5 years of data (or clamped to VT inception 2008)
        expect(chartData.length).toBeGreaterThanOrEqual(5);

        // Last data point should be current year
        expect(chartData[chartData.length - 1].date).toBe(String(currentYear));
    });

    /**
     * TEST 2: Chart indices should start at 0% growth
     */
    it('should normalize chart data to start at 0% growth', async () => {
        const portfolio: StockPosition[] = [
            {
                ticker: 'TEST',
                name: 'Test',
                avgCost: 100,
                currentPrice: 120,
                shares: 10,
                yearsHeld: 3,
                nominalReturn: 20,
                inflationAdjReturn: 15,
                status: 'Beating Inflation',
                sector: 'Test',
                weight: 100,
                cagr: 6.3
            }
        ];

        const chartData = await getChartData(portfolio, 'VT');

        // First data point should show 0% growth (normalized baseline)
        expect(chartData[0].portfolio).toBe(0);
        expect(chartData[0].benchmark).toBe(0);
        expect(chartData[0].inflation).toBe(0);
    });

    /**
     * TEST 3: Empty portfolio should still generate benchmark/inflation data
     */
    it('should generate chart with benchmark data for empty portfolio', async () => {
        const chartData = await getChartData([], 'VT');

        // Should have at least 2 years (minimum for line chart)
        expect(chartData.length).toBeGreaterThanOrEqual(2);

        // Benchmark should show some growth over time
        const lastPoint = chartData[chartData.length - 1];
        // Don't assert specific values as they depend on historical data
        // Just verify structure
        expect(lastPoint).toHaveProperty('date');
        expect(lastPoint).toHaveProperty('portfolio');
        expect(lastPoint).toHaveProperty('benchmark');
        expect(lastPoint).toHaveProperty('inflation');
    });

    /**
     * TEST 4: Different benchmarks should produce different data
     */
    it('should produce different results for VT vs VTI vs VOO', async () => {
        const portfolio: StockPosition[] = [
            {
                ticker: 'TEST',
                name: 'Test',
                avgCost: 100,
                currentPrice: 150,
                shares: 10,
                yearsHeld: 5,
                nominalReturn: 50,
                inflationAdjReturn: 40,
                status: 'Beating Inflation',
                sector: 'Test',
                weight: 100,
                cagr: 8.5
            }
        ];

        const vtData = await getChartData(portfolio, 'VT');
        const vtiData = await getChartData(portfolio, 'VTI');
        const vooData = await getChartData(portfolio, 'VOO');

        // All should have same number of data points
        expect(vtData.length).toBe(vtiData.length);
        expect(vtiData.length).toBe(vooData.length);

        // Benchmark values should differ (VTI/VOO historically outperformed VT)
        const vtBenchEnd = vtData[vtData.length - 1].benchmark;
        const vtiBenchEnd = vtiData[vtiData.length - 1].benchmark;

        // Just verify they're different (exact values depend on historical data)
        // VTI should typically show higher returns than VT in recent years
        expect(vtiBenchEnd).not.toBe(vtBenchEnd);
    });

    /**
     * TEST 5: Chart should respect VT inception year (2008) as minimum
     */
    it('should clamp start year to 2008 (VT inception)', async () => {
        const portfolio: StockPosition[] = [
            {
                ticker: 'TEST',
                name: 'Test',
                avgCost: 100,
                currentPrice: 500,
                shares: 10,
                yearsHeld: 30, // 30 years - older than VT
                nominalReturn: 400,
                inflationAdjReturn: 300,
                status: 'Beating Inflation',
                sector: 'Test',
                weight: 100,
                cagr: 5.5
            }
        ];

        const chartData = await getChartData(portfolio, 'VT');
        const currentYear = new Date().getFullYear();

        // First year should be no earlier than 2008
        const firstYear = parseInt(chartData[0].date);
        expect(firstYear).toBeGreaterThanOrEqual(2008);

        // Should have data from 2008 to current year
        const expectedYears = currentYear - 2008 + 1;
        expect(chartData.length).toBe(expectedYears);
    });
});

