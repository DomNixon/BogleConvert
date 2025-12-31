import { fetchAndCachePrices, Env, StockData } from '../utils/stockData';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env } = context;

    if (!env.PRICES) {
        return new Response('Missing PRICES KV binding', { status: 500 });
    }

    try {
        let masterPrices = await env.PRICES.get<Record<string, StockData>>('MASTER_PRICES', { type: 'json' });
        let needsRefresh = false;

        if (!masterPrices) {
            needsRefresh = true;
        } else {
            // Check Freshness (e.g., is data older than 24 hours?)
            // We check the first key's timestamp as a proxy for the whole set
            const firstKey = Object.keys(masterPrices)[0];
            if (firstKey && masterPrices[firstKey]?.last_pulled) {
                const lastPulled = new Date(masterPrices[firstKey].last_pulled).getTime();
                const now = new Date().getTime();
                const hoursDiff = (now - lastPulled) / (1000 * 60 * 60);

                if (hoursDiff > 24) {
                    needsRefresh = true;
                }
            } else {
                needsRefresh = true;
            }
        }

        if (needsRefresh) {
            console.log("Data stale or missing. Triggering on-demand refresh...");
            const refreshResult = await fetchAndCachePrices(env);
            if (refreshResult) {
                masterPrices = refreshResult.prices;
            }
        }

        if (!masterPrices) {
            return new Response(JSON.stringify({}), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60',
                },
            });
        }

        // Return the data
        return new Response(JSON.stringify(masterPrices), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=14400', // Client cache 4 hours
            },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
