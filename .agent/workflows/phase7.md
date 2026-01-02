---
description: Guide Enhancements - Return Metrics Explained
---

# PHASE 7: Guide Enhancements - Understanding Returns

## Background
Users may not understand the difference between Nominal Return, Real Return (Inflation-Adjusted), and CAGR. The Guide needs a clear educational section.

## Task 7.1: Add "Understanding Your Returns" Section
**File:** `components/HelpAbout.tsx`

Insert a new `<section>` after "How to Use This Tool" with the following content:

### Section Structure:
```
## Understanding Your Returns

### 1. Nominal Return (%)
- What it is: Raw percentage gain/loss
- Formula: (Current Price - Avg Cost) / Avg Cost × 100
- Example with numbers
- Caveat: Does NOT account for inflation

### 2. Real Return (Inflation-Adjusted, %)
- What it is: Gain in actual purchasing power
- Formula: ((1 + Nominal) / (1 + Cumulative Inflation)) - 1
- Example with numbers
- Why it matters: "Silent tax" explanation

### 3. CAGR (Compound Annual Growth Rate, %)
- What it is: Annualized growth rate
- Formula: (End/Start)^(1/years) - 1
- Example with numbers
- Use case: Comparing investments of different durations

### Quick Reference Table
| Metric | Uses Time? | Uses Inflation? | Best For |
|--------|------------|-----------------|----------|

### Tip Alert
"A good investment beats inflation AND the benchmark."
```

## Task 7.2: Add Disclaimers
**File:** `components/HelpAbout.tsx`

Add the following disclaimers in appropriate locations:

1. **Price Return Only:** "This tool measures price return only. Dividends are not included. High-dividend stocks may appear to underperform their actual total return."

2. **Approximate Inflation Data:** "Inflation data is approximate and based on historical CPI-U annual averages. For precise calculations, consult official BLS data."

3. **Chart Projection Disclaimer:** "The portfolio chart shows a simplified projection based on your holdings' implied return vs the benchmark. It does not represent actual historical price movements."

## Task 7.3: Clarify "Tracking Market" Status
**File:** `components/HelpAbout.tsx` (or Dashboard if tooltip exists)

1. Explain what each status means:
   - **Beating Inflation:** Real Return > 0%
   - **Tracking Market:** Real Return between -5% and 0%
   - **Losing Power:** Real Return < -5%

2. Note: "Tracking Market" does NOT mean the stock tracks a market index—it means the real return is close to zero (neither gaining nor losing purchasing power significantly).

## Verification
// turbo
1. Run `npm run dev`
2. Navigate to "The Guide" section
3. Confirm new "Understanding Your Returns" section is visible
4. Confirm all three metrics are explained with examples
5. Confirm disclaimers are present
