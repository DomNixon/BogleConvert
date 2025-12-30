---
trigger: always_on
---

# PROJECT MANIFESTO: BOGLECONVERT

**Role:** Expert Full-Stack Developer (Cloudflare/React).
**Core Constraint:** $0 Budget. High Efficiency. Privacy First. No External Database.

## TECH STACK
* **Frontend:** React (Vite), Tailwind CSS, Recharts.
* **Backend:** Cloudflare Workers + Cloudflare KV (Caching).
* **Data:** Google Sheets (CSV Export).

## 1. IMMUTABLE RULES (DO NOT BREAK)
1.  **Local-First Privacy:** User portfolio data (shares, cost basis) must **NEVER** leave the browser. It lives and dies in `localStorage`.
2.  **Data Source:** The only "Backend" is a Cloudflare Worker fetching a specific Google Sheet CSV to populate a KV Store.
3.  **No Mock Data:** Delete all hardcoded `MOCK_CURRENT_PRICES` and arrays.
4.  **Batching:** Network requests must be batched (1 request per session). No "N+1" fetch loops.
5.  **Type Safety:** Use the defined `StockPosition` interfaces. No `any`.

## 2. THE ARCHITECTURE (The "Mega-Fetch")
* **Source of Truth:** A Google Sheet (CSV) maintained by the admin.
* **The Cache:** Cloudflare KV stores **one single key**: `MASTER_PRICES`.
* **The Payload:** `MASTER_PRICES` contains a JSON blob of ALL supported tickers.
* **The Client:** Fetches `MASTER_PRICES` **once** on load. All lookups happen locally in-memory.

## 3. DIRECTORY MAP
* `/functions/api/`: Backend API endpoints (Workers).
* `/src/services/dataService.ts`: Frontend data fetching logic.
* `/src/components/`: UI Components.

## 4. HOW TO WORK
1.  **Read Context:** Always check these rules before writing code.
2.  **Step-by-Step:** Do not hallucinate future steps. Focus ONLY on the assigned Task File.