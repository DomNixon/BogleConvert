export interface Env {
  SHEET_CSV_URL: string;
  PRICES: KVNamespace;
}

interface StockData {
  price: number;
  last_pulled: string;
  data_timestamp: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.SHEET_CSV_URL) {
    return new Response('Missing SHEET_CSV_URL environment variable', { status: 500 });
  }

  if (!env.PRICES) {
    return new Response('Missing PRICES KV binding', { status: 500 });
  }

  try {
    const response = await fetch(env.SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const prices: Record<string, StockData> = {};
    const timestamp = new Date().toISOString();

    // Skip header row if present (assuming first row is header)
    // CSV Expected Format: Ticker, Price, ...
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
            price,
            last_pulled: timestamp,
            data_timestamp: timestamp, // In a real sheet, might come from a column
          };
        }
      }
    }

    await env.PRICES.put('MASTER_PRICES', JSON.stringify(prices));

    return new Response(JSON.stringify({ success: true, count: Object.keys(prices).length, timestamp }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
