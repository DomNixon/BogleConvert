---
description: Logic Fix
---

# PHASE 3: Critical Logic Fixes

## Task 3.1: Fix Short-Term Holding Bug
**File:** `components/App.tsx` (Logic Check)
* **Bug:** `yearsHeld < 1` logic currently creates massive CAGR spikes.
* **Fix:** If `yearsHeld < 1`, default the denominator to `1` OR display a "Not enough data" warning for CAGR.

## Task 3.2: Fix Inflation Compounding
**File:** `services/dataService.ts`
* **Bug:** Inflation is currently calculated linearly: `(1 + rate * remainder)`.
* **Fix:** Change to geometric compounding: `Math.pow((1 + rate), remainder)`.