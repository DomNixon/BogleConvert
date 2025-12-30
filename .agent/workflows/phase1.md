---
description: Backend 
---

# PHASE 1: The "Zero-Cost" Data Pipeline

## Task 1.1: The Ingestion Worker
**Goal:** Pull data from Google Sheets and save to KV.
**File:** `functions/api/refresh-data.ts`
1.  Fetch the Google Sheet CSV (URL provided via env var `SHEET_CSV_URL`).
2.  Parse CSV into a single JSON object.
    * Key: Ticker (e.g., "AAPL")
    * Value: Object containing `price`, `last_pulled`, `data_timestamp`.
3.  Save this entire object to Cloudflare KV with key `MASTER_PRICES`.

## Task 1.2: The Client Endpoint
**Goal:** Serve the data to the user.
**File:** `functions/api/batch-quote.ts`
1.  Fetch `MASTER_PRICES` from KV.
2.  Return the JSON with `Cache-Control: public, max-age=14400` (4 hours).
    * *Why?* Browser caching reduces Worker hits even further.