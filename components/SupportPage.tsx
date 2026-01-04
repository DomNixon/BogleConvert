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

import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

const SupportPage: React.FC = () => {
    const stripeUrl = import.meta.env.VITE_STRIPE_URL;
    const githubRepo = import.meta.env.VITE_GITHUB_REPO;
    const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    // BTC Email protection state
    const [btcState, setBtcState] = useState<'hidden' | 'challenge' | 'loading' | 'revealed' | 'error'>('hidden');
    const [btcEmail, setBtcEmail] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [turnstileToken, setTurnstileToken] = useState<string>('');

    const handleRevealEmail = () => {
        if (!turnstileSiteKey) {
            setErrorMessage('Turnstile not configured. Please contact support.');
            setBtcState('error');
            return;
        }
        setBtcState('challenge');
    };

    const handleTurnstileSuccess = async (token: string) => {
        setTurnstileToken(token);
        setBtcState('loading');

        try {
            const response = await fetch('/api/reveal-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json() as { email?: string; error?: string; verified?: boolean };

            if (response.ok && data.email) {
                setBtcEmail(data.email);
                setBtcState('revealed');
            } else {
                setErrorMessage(data.error || 'Verification failed. Please try again.');
                setBtcState('error');
            }
        } catch (err) {
            setErrorMessage('Network error. Please check your connection and try again.');
            setBtcState('error');
        }
    };

    const handleCopyEmail = () => {
        if (btcEmail) {
            navigator.clipboard.writeText(btcEmail);
            alert(`Copied to clipboard: ${btcEmail}`);
        }
    };

    const handleRetry = () => {
        setBtcState('hidden');
        setErrorMessage('');
        setTurnstileToken('');
    };

    const supportOptions = [
        {
            id: 'stripe',
            title: 'Credit Card (Stripe)',
            icon: 'credit_card',
            description: 'Support us with a one-time or recurring donation via Stripe',
            value: stripeUrl,
            buttonText: 'Donate via Stripe',
            action: () => stripeUrl && window.open(stripeUrl, '_blank'),
            gradient: 'from-blue-500/20 to-indigo-600/20',
            border: 'border-blue-500/20',
            iconColor: 'text-blue-400'
        },
        {
            id: 'github',
            title: 'Contribute to the Code',
            icon: 'code',
            description: 'Help improve BogleConvert by contributing to our open-source repository',
            value: githubRepo,
            buttonText: 'View on GitHub',
            action: () => githubRepo && window.open(githubRepo, '_blank'),
            gradient: 'from-purple-500/20 to-pink-600/20',
            border: 'border-purple-500/20',
            iconColor: 'text-purple-400'
        }
    ];

    return (
        <div className="h-full overflow-auto bg-bg-dark">
            <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:px-8 md:py-12">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <span className="material-symbols-outlined text-6xl text-secondary">
                            favorite
                        </span>
                    </div>
                    <h1 className="mb-3 text-4xl font-bold font-display text-white">
                        Support BogleConvert
                    </h1>
                    <p className="text-lg text-muted max-w-2xl mx-auto">
                        BogleConvert is built with 0% expense ratio for the community.
                        Your support helps us maintain and improve this free tool.
                    </p>
                </div>

                {/* Support Options Grid */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
                    {/* Stripe */}
                    {supportOptions.map((option) => (
                        <div
                            key={option.id}
                            className={`rounded-lg bg-gradient-to-br ${option.gradient} p-6 border ${option.border} transition-all hover:scale-105 flex flex-col`}
                        >
                            {/* Icon & Title */}
                            <div className="mb-4 flex items-center gap-3">
                                <span className={`material-symbols-outlined text-4xl ${option.iconColor}`}>
                                    {option.icon}
                                </span>
                                <h2 className="text-xl font-semibold text-white">
                                    {option.title}
                                </h2>
                            </div>

                            {/* Description */}
                            <p className="mb-4 text-sm text-muted leading-relaxed flex-grow">
                                {option.description}
                            </p>

                            {/* Action Button - mt-auto pushes to bottom */}
                            <div className="mt-auto">
                                <button
                                    onClick={option.action}
                                    disabled={!option.value}
                                    className={`w-full rounded-md py-2.5 text-sm font-semibold transition-all ${option.value
                                        ? 'bg-white text-black hover:bg-gray-100'
                                        : 'bg-white/10 text-muted cursor-not-allowed'
                                        }`}
                                >
                                    {option.buttonText}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Bitcoin - Protected with Turnstile */}
                    <div className="rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-600/20 p-6 border border-orange-500/20 transition-all hover:scale-105 flex flex-col">
                        {/* Icon & Title */}
                        <div className="mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-orange-400">
                                currency_bitcoin
                            </span>
                            <h2 className="text-xl font-semibold text-white">
                                Bitcoin to Email (Proton)
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="mb-4 text-sm text-muted leading-relaxed flex-grow">
                            Send Bitcoin directly to our Proton email address
                        </p>

                        {/* Dynamic Content - Only show when not hidden */}
                        {btcState !== 'hidden' && (
                            <div className="mb-4 rounded bg-black/20 p-3 min-h-[60px] flex items-center justify-center">
                                {btcState === 'challenge' && turnstileSiteKey && (
                                    <div className="w-full flex justify-center">
                                        <Turnstile
                                            siteKey={turnstileSiteKey}
                                            onSuccess={handleTurnstileSuccess}
                                            onError={() => {
                                                setErrorMessage('Challenge failed. Please try again.');
                                                setBtcState('error');
                                            }}
                                            options={{
                                                theme: 'dark',
                                                size: 'normal',
                                            }}
                                        />
                                    </div>
                                )}

                                {btcState === 'loading' && (
                                    <div className="flex items-center gap-2 text-xs text-muted">
                                        <span className="material-symbols-outlined text-sm animate-spin">
                                            progress_activity
                                        </span>
                                        <span>Verifying...</span>
                                    </div>
                                )}

                                {btcState === 'revealed' && (
                                    <p className="text-xs text-muted break-all font-mono">
                                        {btcEmail}
                                    </p>
                                )}

                                {btcState === 'error' && (
                                    <div className="text-xs text-red-400 text-center">
                                        <span className="material-symbols-outlined text-sm mb-1">
                                            error
                                        </span>
                                        <p>{errorMessage}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Button - mt-auto pushes to bottom */}
                        <div className="mt-auto">
                            {btcState === 'hidden' && (
                                <button
                                    onClick={handleRevealEmail}
                                    className="w-full rounded-md py-2.5 text-sm font-semibold transition-all bg-white text-black hover:bg-gray-100"
                                >
                                    Reveal Email
                                </button>
                            )}

                            {btcState === 'revealed' && (
                                <button
                                    onClick={handleCopyEmail}
                                    className="w-full rounded-md py-2.5 text-sm font-semibold transition-all bg-white text-black hover:bg-gray-100"
                                >
                                    Copy BTC Email
                                </button>
                            )}

                            {btcState === 'error' && (
                                <button
                                    onClick={handleRetry}
                                    className="w-full rounded-md py-2.5 text-sm font-semibold transition-all bg-white text-black hover:bg-gray-100"
                                >
                                    Try Again
                                </button>
                            )}

                            {(btcState === 'challenge' || btcState === 'loading') && (
                                <button
                                    disabled
                                    className="w-full rounded-md py-2.5 text-sm font-semibold transition-all bg-white/10 text-muted cursor-not-allowed"
                                >
                                    {btcState === 'loading' ? 'Verifying...' : 'Complete Challenge'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 p-6 border border-primary/20">
                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-3xl text-primary flex-shrink-0">
                            info
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Why Support BogleConvert?
                            </h3>
                            <ul className="space-y-2 text-sm text-muted">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">
                                        check_circle
                                    </span>
                                    <span>Keep the platform completely free with no ads or tracking</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">
                                        check_circle
                                    </span>
                                    <span>Fund ongoing development and new features</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">
                                        check_circle
                                    </span>
                                    <span>Support the open-source community and financial literacy</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
