---
description: Portfolio Weight Calculation Fix
---

# PHASE 5: Fix Portfolio Weight Calculation

## Background
The `weight` property on `StockPosition` is always `0` because it's never calculated. This breaks the "Portfolio Composition Analysis" treemap and concentration risk metrics.

## Task 5.1: Calculate Weights on Portfolio Change
**File:** `App.tsx`
1. Create a helper function `recalculateWeights(portfolio: StockPosition[]): StockPosition[]`
2. Calculate total portfolio value: `sum(currentPrice * shares)` for all positions
3. For each position: `weight = (currentPrice * shares) / totalValue * 100`
4. Call this function:
   - After `calculateStats()` in the initial load
   - In `handleUpdateStock` when `avgCost`, `shares`, or `currentPrice` changes
   - In `handleTickerBlur` after fetching new price
   - In `handleDeleteRow` after removing a position
   - In `handleBulkImport` after processing all rows

## Task 5.2: Update Demo Portfolio
**File:** `services/dataService.ts`
1. Either remove hardcoded `weight` values from `DEMO_PORTFOLIO`
2. OR mark with a comment that weights will be recalculated on load

## Verification
// turbo
1. Run `npm run dev` and load demo portfolio
2. Navigate to "Analysis" tab
3. Confirm treemap shows actual percentages (not 0%)
4. Confirm total of all weights equals ~100%
