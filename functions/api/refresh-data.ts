import { fetchAndCachePrices, Env } from '../utils/stockData';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.PRICES) {
    return new Response('Missing PRICES KV binding', { status: 500 });
  }

  try {
    const result = await fetchAndCachePrices(env);

    if (result) {
      return new Response(JSON.stringify({
        success: true,
        source: result.source,
        count: Object.keys(result.prices).length,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: "Failed to fetch data from any source." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
