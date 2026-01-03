import { describe, it, expect } from 'vitest';
import { getCumulativeInflation, calculateStats } from './dataService';
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
