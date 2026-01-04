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

import { fetchAndCachePrices, Env, StockData } from '../utils/stockData';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env } = context;

    if (!env.PRICES) {
        return new Response('Missing PRICES KV binding', { status: 500 });
    }

    try {
        // 1. Fetch current data and metadata
        const { value: storedPrices, metadata } = await env.PRICES.getWithMetadata<Record<string, StockData>>(
            "MASTER_PRICES",
            { type: "json" }
        );

        let masterPrices = storedPrices;
        let needsRefresh = false;

        const lastPulledStr = (metadata as { timestamp?: string })?.timestamp;

        if (!masterPrices) {
            needsRefresh = true;
        } else if (lastPulledStr) {
            const lastPulled = new Date(lastPulledStr).getTime();
            const now = new Date().getTime();
            const hoursDiff = (now - lastPulled) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                needsRefresh = true;
            }
        } else {
            // If data exists but no metadata (legacy data), refresh to migrate structure
            needsRefresh = true;
        }

        // 2. Refresh if needed
        if (needsRefresh) {
            console.log("Data stale or missing. Triggering on-demand refresh...");
            const refreshResult = await fetchAndCachePrices(env);
            if (refreshResult && refreshResult.prices) {
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

        // 3. Return the data
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
