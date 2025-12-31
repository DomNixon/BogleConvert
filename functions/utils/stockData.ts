export interface Env {
    Exchange_Stock_Data?: string;
    SHEET_CSV_URL?: string;
    PRICES: KVNamespace;
}

export interface StockData {
    price: number;
}

interface StockJsonItem {
    symbol: string;
    lastsale: string;
}

export async function fetchAndCachePrices(env: Env): Promise<{ prices: Record<string, StockData>, source: string } | null> {
    // 1. Try Primary Source (JSON) via Exchange_Stock_Data
    try {
        if (env.Exchange_Stock_Data) {
            const response = await fetch(env.Exchange_Stock_Data);
            if (response.ok) {
                const jsonText = await response.text();
                // Validation: Simple check if it looks like JSON
                if (jsonText.trim().startsWith('[')) {
                    const jsonData = JSON.parse(jsonText) as StockJsonItem[];
                    const prices: Record<string, StockData> = {};
                    
                    for (const item of jsonData) {
                        const ticker = item.symbol;
                        // Remove '$' and parse
                        const priceStr = item.lastsale.replace('$', '').trim();
                        const price = parseFloat(priceStr);

                        if (ticker && !isNaN(price)) {
                            prices[ticker.toUpperCase()] = {
                                price
                            };
                        }
                    }

                    if (Object.keys(prices).length > 0) {
                        // Store with Metadata for freshness tracking
                        await env.PRICES.put('MASTER_PRICES', JSON.stringify(prices), {
                            metadata: { timestamp: new Date().toISOString() }
                        });
                        return { prices, source: 'JSON' };
                    }
                }
            } else {
                console.warn(`Primary JSON fetch failed: ${response.status}`);
            }
        }
    } catch (e) {
        console.error("Primary JSON source failed, falling back...", e);
    }

    // 2. Fallback Source (Google Sheet CSV)
    if (!env.SHEET_CSV_URL) {
        console.error('Missing SHEET_CSV_URL environment variable for fallback');
        return null;
    }

    try {
        const response = await fetch(env.SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        const csvText = await response.text();

        // Validate we didn't get HTML
        if (csvText.trim().startsWith('<!DOCTYPE html') || csvText.includes('<html')) {
            throw new Error('Received HTML instead of CSV.');
        }

        const lines = csvText.split('\n');
        const prices: Record<string, StockData> = {};
        const startIdx = 1;

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length >= 2) {
                const ticker = parts[0].trim().toUpperCase();
                const priceStr = parts[1].trim();
                const price = parseFloat(priceStr);

                if (ticker && !isNaN(price)) {
                    prices[ticker] = {
                        price
                    };
                }
            }
        }

        if (Object.keys(prices).length > 0) {
            await env.PRICES.put('MASTER_PRICES', JSON.stringify(prices), {
                metadata: { timestamp: new Date().toISOString() }
            });
            return { prices, source: 'CSV_Fallback' };
        }

    } catch (err) {
        console.error("Fallback CSV source failed", err);
    }

    return null;
}
