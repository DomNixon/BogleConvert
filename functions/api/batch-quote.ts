export interface Env {
    PRICES: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env } = context;

    if (!env.PRICES) {
        return new Response('Missing PRICES KV binding', { status: 500 });
    }

    try {
        const masterPrices = await env.PRICES.get('MASTER_PRICES', { type: 'json' });

        if (!masterPrices) {
            // If no data is found, return an empty object or a specific error code
            // depending on how the frontend handles it. For now, empty object.
            return new Response(JSON.stringify({}), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60', // Short cache if empty/error
                },
            });
        }

        // Return the cached data with a long cache time (4 hours)
        return new Response(JSON.stringify(masterPrices), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=2592000', // 30 days
            },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
