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

import { Env } from '../utils/stockData';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
    challenge_ts?: string;
    hostname?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // CORS headers for local dev and production
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Parse request body
        const body = await request.json() as { token?: string };
        const token = body.token;

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing Turnstile token' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Verify environment variables are set
        if (!env.TURNSTILE_SECRET_KEY) {
            console.error('TURNSTILE_SECRET_KEY not configured');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!env.BTC_EMAIL) {
            console.error('BTC_EMAIL not configured');
            return new Response(JSON.stringify({ error: 'Email not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Verify Turnstile token with Cloudflare
        const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: env.TURNSTILE_SECRET_KEY,
                response: token,
            }),
        });

        const verifyResult = await verifyResponse.json() as TurnstileVerifyResponse;

        // 4. Check verification result
        if (!verifyResult.success) {
            console.log('Turnstile verification failed:', verifyResult['error-codes']);
            return new Response(JSON.stringify({
                error: 'Verification failed. Please try again.',
                details: verifyResult['error-codes']
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 5. Verification successful - return the email
        return new Response(JSON.stringify({
            email: env.BTC_EMAIL,
            verified: true
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store', // Don't cache the email
            },
        });

    } catch (err) {
        console.error('Error in reveal-email endpoint:', err);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: (err as Error).message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};
