/*
 * Copyright (c) 2026 Mid Michigan Connections LLC.
 * This file is part of BogleConvert.
 *
 * BogleConvert is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * BogleConvert is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with BogleConvert. If not, see <https://www.gnu.org/licenses/>.
 */

export interface Env {
    Exchange_Stock_Data?: string;
    SHEET_CSV_URL?: string;
    PRICES: KVNamespace;
    TURNSTILE_SECRET_KEY?: string;
    BTC_EMAIL?: string;
}

export interface StockData {
    price: number;
    name?: string;
    industry?: string;
    sector?: string;
}

interface StockJsonItem {
    symbol: string;
    name: string;
    lastsale: string;
    industry?: string;
    sector?: string;
}

export async function fetchAndCachePrices(env: Env): Promise<{ prices: Record<string, StockData>, source: string } | null> {
    const prices: Record<string, StockData> = {};
    let jsonCount = 0;
    let csvCount = 0;

    // 1. Parallel Fetch (Fail-safe)
    const [jsonResult, csvResult] = await Promise.allSettled([
        env.Exchange_Stock_Data ? fetch(env.Exchange_Stock_Data).then(res => res.ok ? res.text() : null) : Promise.resolve(null),
        env.SHEET_CSV_URL ? fetch(env.SHEET_CSV_URL).then(res => res.ok ? res.text() : null) : Promise.resolve(null)
    ]);

    // 2. Process JSON (Primary - Rich Metadata)
    if (jsonResult.status === 'fulfilled' && jsonResult.value) {
        try {
            const jsonText = jsonResult.value;
            // Basic validation
            if (jsonText.trim().startsWith('[')) {
                const jsonData = JSON.parse(jsonText) as StockJsonItem[];

                for (let i = 0, len = jsonData.length; i < len; i++) {
                    const item = jsonData[i];
                    // Skip if symbol is missing
                    if (!item.symbol) continue;

                    const ticker = item.symbol.trim().toUpperCase();
                    if (!ticker) continue;

                    // Lightweight parse: Remove '$' and ','
                    const priceStr = item.lastsale.replace(/[$,]/g, '');
                    const price = parseFloat(priceStr);

                    if (!isNaN(price)) {
                        prices[ticker] = {
                            price,
                            name: item.name ? item.name.trim() : undefined,
                            industry: item.industry ? item.industry.trim() : undefined,
                            sector: item.sector ? item.sector.trim() : undefined
                        };
                        jsonCount++;
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing JSON source:", e);
        }
    }

    // 3. Process CSV (Fallback/Supplement)
    // "The Google Sheet will start at 250 entries and will likely grow to about 1,000"
    // Optimization: Standard split is fine for 1000 lines.
    if (csvResult.status === 'fulfilled' && csvResult.value) {
        try {
            const csvText = csvResult.value;
            // Validate it's not HTML error page
            if (!csvText.trim().startsWith('<!DOCTYPE html') && !csvText.includes('<html')) {
                const lines = csvText.split('\n');

                // Start at 1 to skip header
                for (let i = 1, len = lines.length; i < len; i++) {
                    const line = lines[i];
                    if (!line) continue;

                    // optimization: use indexOf to find split point instead of full split if simple
                    // But CSV might have quoted fields. Assuming simple "Symbol, Price" format for now based on previous code.
                    const parts = line.split(',');

                    if (parts.length >= 3) {
                        const ticker = parts[0].trim().toUpperCase();

                        // ONLY add if not already present from JSON (JSON is master)
                        if (ticker && !prices[ticker]) {
                            const name = parts[1].trim();
                            const priceStr = parts[2].trim();
                            const price = parseFloat(priceStr);

                            if (!isNaN(price)) {
                                prices[ticker] = {
                                    price,
                                    name: name || undefined
                                };
                                csvCount++;
                            }
                        }
                    } else if (parts.length === 2) {
                        // Backwards compatibility for Ticker, Price
                        const ticker = parts[0].trim().toUpperCase();

                        if (ticker && !prices[ticker]) {
                            const priceStr = parts[1].trim();
                            const price = parseFloat(priceStr);

                            if (!isNaN(price)) {
                                prices[ticker] = { price };
                                csvCount++;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing CSV source:", e);
        }
    }

    const totalCount = jsonCount + csvCount;
    if (totalCount > 0) {
        const sourceMeta = `JSON:${jsonCount},CSV:${csvCount}`;
        console.log(`Merged prices cache update. Sub-sources: ${sourceMeta}`);

        await env.PRICES.put('MASTER_PRICES', JSON.stringify(prices), {
            metadata: {
                timestamp: new Date().toISOString(),
                stats: sourceMeta
            }
        });
        return { prices, source: 'merged' };
    }

    return null;
}
