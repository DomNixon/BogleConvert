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

import React from 'react';

const HelpAbout: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-bg-dark animate-in fade-in duration-500">
            <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-12 pb-24">
                <header className="space-y-3 border-b border-outline pb-6">
                    <h1 className="text-3xl md:text-4xl font-bold font-display text-white">The Guide: BogleConvert</h1>
                    <p className="text-lg text-muted">Understanding the philosophy and tools behind BogleConvert.</p>
                </header>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-display text-white">Why We Created This Tool</h2>
                    <div className="space-y-4 text-gray-300 leading-relaxed text-base md:text-lg font-light">
                        <p>This service was built for the <span className="text-white font-medium">"Recovering Stock Picker."</span></p>
                        <p>Many of us discover the <a href="https://www.bogleheads.org/wiki/Bogleheads%C2%AE_investment_philosophy" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Bogleheads® investment philosophy</a>, a low-cost, diversified, index fund investing only after we have already accumulated a collection of individual stocks. We often hold onto these legacy positions because we don't know if they are actually helping or hurting our long-term wealth.</p>
                        <p>We created BogleConvert to answer one simple question:</p>
                        <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 text-white font-medium italic bg-white/5 rounded-r-lg">
                            "What is the opportunity cost of holding this individual stock instead of just 'buying the haystack' (VT)?"
                        </blockquote>
                        <p>This tool helps you visualize your Real Return (inflation-adjusted) compared to a Global Market Benchmark, helping you make data-driven decisions about whether to simplify your portfolio.</p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-display text-white">How to Use This Tool</h2>
                    <p className="text-gray-300 text-lg">We designed this for speed and simplicity. You do not need to connect your brokerage account.</p>

                    <div className="bg-surface rounded-xl border border-outline p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Step 1: The "Snapshot" Entry</h3>
                        <p className="text-muted">Since brokerage apps rarely give you a clear view of your long-term performance against a benchmark, we use a "Snapshot" method.</p>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300 marker:text-secondary">
                            <li><strong className="text-white">Ticker:</strong> Enter the symbol (e.g., NVDA, TSLA).</li>
                            <li><strong className="text-white">Average Cost:</strong> Enter your "Avg Price" or "Cost Basis" from your brokerage app.</li>
                            <li><strong className="text-white">Total Shares:</strong> Enter your current share count.</li>
                            <li><strong className="text-white">Time Held:</strong> Select the approximate duration you have held this position (e.g., &lt; 1 Year, 3 Years+). Note: We use this to estimate the inflation drag on your returns.</li>
                        </ul>
                    </div>

                    <div className="bg-surface rounded-xl border border-outline p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Step 2: Interpreting the "Health" Chart</h3>
                        <p className="text-muted">The chart visualizes a "race" between your stock, the global market, and inflation.</p>
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex items-start gap-4">
                                <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: '#38bdf8' }}></div>
                                <span><span style={{ color: '#38bdf8' }} className="font-bold">The Blue Line (Your Portfolio):</span> This is your asset's growth.</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: '#64748b' }}></div>
                                <span><span style={{ color: '#64748b' }} className="font-bold">The Gray Line (Benchmark):</span> This is what your money could have done in the selected index fund (VT, VTI, or VOO).</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0 border-2 border-dashed border-[#4ade80] bg-transparent"></div>
                                <span><span style={{ color: '#4ade80' }} className="font-bold">The Green Dotted Line (Inflation):</span> This is the "purchasing power" baseline.</span>
                            </li>
                        </ul>
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                            <p className="text-gray-300 font-medium">What the status labels mean:</p>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <span style={{ color: '#4ade80' }} className="font-bold">Beating Inflation:</span> Real Return ≥ 1%. You are gaining purchasing power.
                                </li>
                                <li>
                                    <span className="text-gray-400 font-bold">Tracking Market:</span> Real Return between -1% and 1%. You are preserving wealth but not significantly outperforming.
                                    <span className="block text-xs text-muted mt-0.5 ml-2">Note: This does NOT mean your stock is tracking a market index. It means your real return is close to zero.</span>
                                </li>
                                <li>
                                    <span style={{ color: '#a855f7' }} className="font-bold">Losing Power:</span> Real Return &lt; -1%. Your investment is lagging behind inflation.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-display text-white">Understanding Your Returns</h2>
                    <div className="bg-surface rounded-xl border border-outline p-6 space-y-6">
                        {/* 1. Nominal Return */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                1. Nominal Return (%)
                            </h3>
                            <p className="text-gray-300">The raw percentage gain or loss on your investment.</p>
                            <div className="bg-bg-dark p-3 rounded-lg font-mono text-sm text-secondary">
                                (Current Price - Avg Cost) / Avg Cost × 100
                            </div>
                            <p className="text-sm text-muted">Example: You bought at $100. It's now $110. Nominal Return = 10%.</p>
                            <p className="text-sm text-negative font-medium">Caveat: This does NOT account for inflation.</p>
                        </div>

                        <hr className="border-white/10" />

                        {/* 2. Real Return */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                2. Real Return (Inflation-Adjusted %)
                            </h3>
                            <p className="text-gray-300">Your gain in actual purchasing power. This is the "Truth" BogleConvert reveals.</p>
                            <div className="bg-bg-dark p-3 rounded-lg font-mono text-sm text-secondary">
                                ((1 + Nominal) / (1 + Cumulative Inflation)) - 1
                            </div>
                            <p className="text-sm text-muted">Example: Your 10% nominal gain occurred while inflation was 5%. Your Real Return is roughly 4.7%.</p>
                            <p className="text-sm text-amber-400 font-medium">Why it matters: Calculated using historical CPI data for your specific holding period.</p>
                        </div>

                        <hr className="border-white/10" />

                        {/* 3. CAGR */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                3. CAGR (Compound Annual Growth Rate %)
                            </h3>
                            <p className="text-gray-300">The smoother annualized growth rate.</p>
                            <div className="bg-bg-dark p-3 rounded-lg font-mono text-sm text-secondary">
                                (End Value / Start Value)^(1 / Years) - 1
                            </div>
                            <p className="text-sm text-muted">Use case: Best for comparing investments held for different lengths of time.</p>
                        </div>
                    </div>

                    {/* Quick Reference Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300 bg-surface rounded-xl border border-outline">
                            <thead className="text-xs uppercase bg-white/5 text-white">
                                <tr>
                                    <th className="px-6 py-3">Metric</th>
                                    <th className="px-6 py-3">Uses Time?</th>
                                    <th className="px-6 py-3">Uses Inflation?</th>
                                    <th className="px-6 py-3">Best For</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td className="px-6 py-4 font-medium text-white">Nominal</td>
                                    <td className="px-6 py-4">No</td>
                                    <td className="px-6 py-4">No</td>
                                    <td className="px-6 py-4">Quick "app check"</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="px-6 py-4 font-medium text-white">Real Return</td>
                                    <td className="px-6 py-4">Yes (Inflation)</td>
                                    <td className="px-6 py-4">Yes</td>
                                    <td className="px-6 py-4">Actual wealth</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-medium text-white">CAGR</td>
                                    <td className="px-6 py-4">Yes</td>
                                    <td className="px-6 py-4">No</td>
                                    <td className="px-6 py-4">Comparison</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-5 flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">tips_and_updates</span>
                        <p className="text-sm text-secondary">
                            <strong className="text-white">Tip:</strong> A good investment beats inflation AND the benchmark.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-display text-white">Choosing Your Benchmark</h2>
                    <p className="text-gray-300 text-lg">We measure your portfolio's "Health" by comparing it to a low-cost index fund. But which one? We offer three standard options.</p>

                    <div className="grid grid-cols-1 gap-6">
                        {/* 1. VT */}
                        <div className="bg-surface rounded-xl border border-outline p-6 space-y-3">
                            <h3 className="text-xl font-bold text-white">1. Global Market (VT) — The Default</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><strong className="text-white">What it is:</strong> The "Haystack." It tracks nearly every investable public company in the world (US, Europe, Asia, Emerging Markets).</p>
                                <p><strong className="text-white">Why choose it:</strong> This is widely considered the most philosophically neutral starting point. It reflects a global diversification strategy, mitigating "Home Country Bias" and acknowledging the difficulty in predicting which geographic region will outperform in the future.</p>
                                <p><strong className="text-white">Composition:</strong> Roughly 60% US / 40% International (changes dynamically with market caps).</p>
                            </div>
                        </div>

                        {/* 2. VTI */}
                        <div className="bg-surface rounded-xl border border-outline p-6 space-y-3">
                            <h3 className="text-xl font-bold text-white">2. Total US Market (VTI)</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><strong className="text-white">What it is:</strong> The entire United States stock market (Large, Mid, and Small Cap).</p>
                                <p><strong className="text-white">Why choose it:</strong> Select this option if your investment strategy is focused exclusively on the US economy. It provides a comprehensive baseline for portfolios that intentionally forego international diversification.</p>
                                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <p className="text-sm text-amber-200">
                                        <strong className="text-amber-100">Warning:</strong> The US market experienced exceptional outperformance relative to the rest of the world from 2010–2024. While this sets a rigorous standard, it is crucial to select a benchmark based on your long-term strategy, not just recent returns.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. VOO */}
                        <div className="bg-surface rounded-xl border border-outline p-6 space-y-3">
                            <h3 className="text-xl font-bold text-white">3. S&P 500 (VOO)</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><strong className="text-white">What it is:</strong> The 500 largest companies in the US.</p>
                                <p><strong className="text-white">Why choose it:</strong> This index is the standard often cited in financial media. Choose this benchmark if your portfolio is concentrated in large-cap US companies and your goal is to track the performance of America's largest and most established corporations.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-negative/10 border border-negative/20 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-negative">warning</span>
                            The "Benchmark Shopping" Trap
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                            Avoid changing your benchmark simply to improve the visual appearance of your performance chart. If your portfolio is underperforming the Global Market (VT), switching the benchmark does not correct the underlying performance—it merely changes the measurement tool. Select the benchmark that aligns with your strategic asset allocation and stick to it.
                        </p>
                    </div>
                </section>


                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-display text-white">Security & Data Privacy</h2>
                    <div className="space-y-4 text-gray-300 leading-relaxed">
                        <p className="text-lg font-medium text-white">BogleConvert is Local-First. Your data never leaves your device.</p>
                        <div className="bg-surface rounded-xl border border-outline p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-2xl text-secondary flex-shrink-0 mt-1">shield</span>
                                <div className="space-y-3">
                                    <p><strong className="text-white">No Database:</strong> We do not have a backend database storing your portfolio positions, cost basis, or share counts. Everything lives in your browser's localStorage.</p>
                                    <p><strong className="text-white">Market Data Only:</strong> The only data we fetch from our servers is public market pricing data (stock prices, benchmark returns). This data is cached and shared among all users—it contains no personal information.</p>
                                    <p><strong className="text-white">Privacy by Design:</strong> Because your portfolio never leaves your device, we cannot see what stocks you own, how much you've invested, or your performance. This is intentional.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                            <p className="text-sm text-amber-200">
                                <strong className="text-amber-100">Note:</strong> If you clear your browser data or use Incognito Mode, your portfolio will be lost. Consider exporting your data periodically as a CSV backup.
                            </p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                            <p className="text-sm text-blue-200">
                                <strong className="text-blue-100">Roadmap:</strong> Future versions will include community feedback on features which may include encrypted cloud storage.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-display text-white">Transparency & AI Disclosure</h2>
                    <div className="space-y-4 text-gray-300 leading-relaxed">
                        <p>This application is powered by Artificial Intelligence.</p>
                        <p>To provide this tool at a low cost and with high development speed, BogleConvert was designed and coded with the assistance of Generative AI models (including Google Gemini).</p>
                        <p className="font-semibold text-white mt-4">What this means for you:</p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-muted">
                            <li><strong className="text-white">Data Processing:</strong> The logic used to calculate "Real Returns" and generate charts is derived from AI-generated algorithms. While we have rigorously tested these for accuracy, edge cases may exist.</li>
                            <li><strong className="text-white">Dynamic Analysis:</strong> The "Deep Dive" insights and text summaries are generated by AI to explain complex financial data in plain English.</li>
                            <li><strong className="text-white">Verification:</strong> Always verify critical financial figures with your actual brokerage statement before making tax-dependent moves.</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-4 pt-8 border-t border-outline">
                    <h2 className="text-2xl font-bold font-display text-white">Legal & Financial Disclaimer</h2>
                    <div className="p-6 bg-surface/50 rounded-xl border border-outline space-y-4 text-sm text-muted">
                        <p>BogleConvert is for educational and informational purposes only.</p>
                        <ul className="space-y-3 list-inside">
                            <li><strong className="text-white">Not Financial Advice:</strong> The information provided by this website does not constitute investment, tax, or legal advice. We are not financial advisors.</li>
                            <li><strong className="text-white">No Recommendations:</strong> A "Purple" or "Unhealthy" score is not a recommendation to sell. A "Blue" or "Healthy" score is not a recommendation to buy. All investment decisions should be made based on your own risk tolerance and financial situation.</li>
                            <li><strong className="text-white">Market Risk:</strong> Past performance of any security or benchmark (like VT) is not indicative of future results. All investing involves risk, including the possible loss of principal.</li>
                            <li><strong className="text-white">Accuracy:</strong> While we strive to use accurate market data, we cannot guarantee the timeliness or accuracy of stock prices, inflation data, or benchmark returns.</li>
                            <li><strong className="text-white">Price Return Only:</strong> This tool measures price return only. Dividends are not included. High-dividend stocks may appear to underperform their actual total return.</li>
                            <li><strong className="text-white">Approximate Inflation:</strong> Inflation data is approximate and based on historical CPI-U annual averages. For precise calculations, consult official BLS data.</li>
                            <li><strong className="text-white">Chart Projection:</strong> The portfolio chart shows a simplified projection based on your holdings' implied return vs the benchmark. It does not represent actual historical price movements.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HelpAbout;
