---
description: Chart Accuracy and Status Label Improvements
---

# PHASE 8: Chart Accuracy and Status Improvements

## Background
1. The chart reconstructs portfolio history using a simplified "alpha" calculation that assumes consistent outperformance—this may mislead users about volatility.
2. The "Tracking Market" status label is confusing—it implies tracking an index when it actually means near-zero real return.

## Task 8.1: Add Chart Methodology Tooltip/Info
**File:** `components/Dashboard.tsx`

1. Add an info icon (ℹ️) near the chart title or legend
2. On hover/click, display a tooltip or modal:
   ```
   "This chart shows a simplified projection of your portfolio's growth based on 
   your holdings' total return and the benchmark's historical annual returns. 
   It does not represent actual day-to-day or year-to-year price movements of 
   your individual stocks."
   ```

## Task 8.2: Consider Renaming "Tracking Market" Status
**File:** `App.tsx` (status assignment logic)

**Option A - Rename:**
- Change `'Tracking Market'` to `'Near Breakeven'` or `'Flat (Real)'`
- Update all references in:
  - `types.ts` (StockPosition interface)
  - `App.tsx` (calculateStats)
  - `Dashboard.tsx` (display)
  - `PortfolioAnalysis.tsx` (legend and colors)
  - `HelpAbout.tsx` (if mentioned)

**Option B - Keep Name but Add Clarity:**
- Keep `'Tracking Market'` label
- Add subtitle or tooltip: "Real return near 0%"
- Update The Guide to explain this clearly

**Recommended:** Option B is less disruptive.

## Task 8.3: Improve Status Thresholds (Optional)
**File:** `App.tsx`

Current logic:
```typescript
if (stock.inflationAdjReturn > 0) stock.status = 'Beating Inflation';
else if (stock.inflationAdjReturn > -5) stock.status = 'Tracking Market';
else stock.status = 'Losing Power';
```

**Consider:** Tying status to benchmark comparison, not just inflation:
```typescript
// Concept only - would require benchmark CAGR for same period
if (realReturn > benchmarkRealReturn) status = 'Outperforming';
else if (realReturn > 0) status = 'Beating Inflation';
else if (realReturn > -5) status = 'Near Breakeven';
else status = 'Losing Power';
```

**Note:** This is more complex and may require architectural changes. Defer if scope is too large.

## Verification
1. Run `npm run dev`
2. Hover/click chart info icon - tooltip should appear
3. Confirm status labels are clear or clarified in Guide
4. Test edge cases: stocks with exactly 0% real return, -4.9%, -5.1%
