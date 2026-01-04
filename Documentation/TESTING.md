# Test Suite Documentation

**Framework:** Vitest 3.x  
**Test Location:** `services/dataService.test.ts` (co-located with source)

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npx vitest run --coverage

# Watch mode (re-runs on file changes)
npm test -- --watch
```

---

## Test Coverage Summary

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| `dataService.ts` | 67.8% | 65.6% | 38.5% | 67.8% |

> **Note:** Coverage focuses on critical financial logic. UI components (React) are tested manually and via browser automation. Backend Workers are tested in staging environments.

---

## Complete Test List (19 Tests)

### 1. Financial Logic - Reality Checks (5 tests)

These tests verify that financial calculations match mathematical reality.

| # | Test | What It Validates |
|---|------|-------------------|
| 1 | `should calculate CAGR correctly (not linear growth)` | CAGR uses geometric formula: `(End/Start)^(1/n) - 1` |
| 2 | `should compound inflation geometrically (not linearly)` | Inflation compounds: `(1+r)^n`, not `r*n` |
| 3 | `should handle year boundaries without timezone corruption` | Dates don't shift across timezones causing off-by-one |
| 4 | `should calculate real returns using proper inflation adjustment` | Real Return = `((1+N)/(1+I)) - 1` |
| 5 | `should handle CAGR edge cases correctly` | Zero price = 0 CAGR, short holdings use 1yr minimum |

---

### 2. Portfolio Merge Logic (5 tests)

These tests verify that merging share lots calculates correct weighted averages.

| # | Test | What It Validates |
|---|------|-------------------|
| 6 | `should calculate weighted average cost correctly when merging` | `(Shares1*Cost1 + Shares2*Cost2) / TotalShares` |
| 7 | `should add shares together when merging same ticker` | Shares are summed, not replaced |
| 8 | `should calculate weighted average years held` | Years weighted by investment amount to prevent CAGR distortion |
| 9 | `should add new stock to portfolio without merging` | Different tickers are appended, not merged |
| 10 | `should merge full portfolios correctly` | `mergePortfolios()` handles multiple stocks at once |

---

### 3. Status Classification Thresholds (4 tests)

These tests verify the thresholds for performance status labels.

| # | Test | What It Validates |
|---|------|-------------------|
| 11 | `should classify as "Beating Inflation" when real return >= 1%` | Returns above inflation marked correctly |
| 12 | `should classify as "Tracking Market" when real return is between -1% and 1%` | Near-zero real returns marked neutral |
| 13 | `should classify as "Losing Power" when real return < -1%` | Underperformers marked as losing purchasing power |
| 14 | `should handle boundary values correctly` | Exact threshold values (±1%) classified correctly |

**Thresholds:**
- **Beating Inflation:** Real Return ≥ 1%
- **Tracking Market:** -1% ≤ Real Return < 1%
- **Losing Power:** Real Return < -1%

---

### 4. Chart Data Generation (5 tests)

These tests verify chart accuracy and data normalization.

| # | Test | What It Validates |
|---|------|-------------------|
| 15 | `should calculate chart start year based on longest holding` | Chart range matches portfolio age |
| 16 | `should normalize chart data to start at 0% growth` | All series start at 0% for fair comparison |
| 17 | `should generate chart with benchmark data for empty portfolio` | Empty portfolio still shows benchmark/inflation reference lines |
| 18 | `should produce different results for VT vs VTI vs VOO` | Benchmark selection changes chart data |
| 19 | `should clamp start year to 2008 (VT inception)` | No data shown before VT ETF existed |

---

## Test Philosophy

BogleConvert tests follow **Reality Check Testing**:

1. **Known Truths**: Each test represents a mathematically provable scenario
2. **Error Detection**: Tests catch common implementation errors (e.g., linear vs geometric)
3. **Formula Validation**: Tests don't just check "it runs"—they verify the actual math
4. **Edge Cases**: Boundaries and corner cases are explicitly tested

---

## Adding New Tests

When adding tests, follow this pattern:

```typescript
/**
 * TEST: [Descriptive Name]
 * 
 * Scenario: [What situation is being tested]
 * Expected: [What the correct result should be]
 * Common Error: [What mistake this test catches]
 */
it('should [expected behavior]', () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = calculateStats(input);
    
    // Assert
    expect(result.cagr).toBeCloseTo(expectedValue, 1);
});
```

---

## Related Documentation

- [AUDIT_MATH.md](./AUDIT_MATH.md) - Mathematical accuracy verification
- [AUDIT_PRODUCTION.md](./AUDIT_PRODUCTION.md) - Production readiness audit
