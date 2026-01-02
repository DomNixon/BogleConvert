---
description: Remove Mock Data Remnants
---

# PHASE 6: Remove Mock Data Remnants

## Background
`dailyChange` and `yearlyReturn` in `fetchStockQuote` are generated using random numbers. While not currently displayed, they exist in the codebase and could mislead if exposed.

## Task 6.1: Audit Mock Data Usage
**Files to check:**
- `services/dataService.ts`
- `components/Dashboard.tsx`
- `components/StockReport.tsx`
- `components/DeepDivePanel.tsx`

1. Search for usages of `dailyChange` and `yearlyReturn`
2. Determine if these values are displayed anywhere in the UI
3. Document findings

## Task 6.2: Remove or Replace Mock Values
**File:** `services/dataService.ts`

**Option A (Remove):**
1. Remove `dailyChange` and `yearlyReturn` from the return object in `fetchStockQuote`
2. Update the return type accordingly
3. Remove any UI elements that reference these fields

**Option B (Replace with Real Data):**
1. If the Google Sheet or GitHub JSON provides daily/yearly change, use those
2. Otherwise, return `null` or `undefined` and handle gracefully in UI

## Task 6.3: Clean Up Hash-Based Mock Logic
**File:** `services/dataService.ts`

1. Locate hash-based random generation:
   ```typescript
   const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
   const change = (hash % 2 === 0 ? 1 : -1) * (Math.random() * 5);
   ```
2. Remove this logic if `dailyChange` is removed
3. Keep hash only if needed for fallback sector assignment

## Verification
1. Run `npm run dev`
2. Add multiple positions and verify no random values appear
3. Refresh page multiple times - data should be consistent (not random)
