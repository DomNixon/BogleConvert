---
description: Frontend
---

# PHASE 2: Frontend Integration

## Task 2.1: Wire DataService to Worker
**File:** `services/dataService.ts`
1.  **Delete:** Remove `MOCK_CURRENT_PRICES` and old fetch logic.
2.  **Implement:** Create `fetchMarketData()` that calls `/api/batch-quote` **once** on app load.
3.  **Cache:** Store the result in a memory variable so the app doesn't re-fetch during the session.

## Task 2.2: Update Historical Constants
**File:** `services/dataService.ts`
1.  **Update:** `HISTORICAL_INFLATION_RATES` array. Add 2024 and 2025 forecast.
2.  **Update:** Benchmark arrays (`VT_ANNUAL_RETURNS`, etc.). Add 2024 data.