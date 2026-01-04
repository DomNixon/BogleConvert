# BogleConvert

**A Privacy-First Portfolio Tracker Built on the Cloudflare Edge**

BogleConvert is a zero-cost, privacy-focused investment portfolio tracker that helps you analyze your holdings against market performance and inflation. Named in honor of John C. Bogle, founder of Vanguard and pioneer of index investing, this tool follows the Bogleheads philosophy of simple, low-cost, long-term investing.

> **Built by Mid Michigan Connections LLC.**
> BogleConvert is a showcase of high-efficiency, privacy-first web development. We built this to demonstrate how powerful modern web architecture can be done without bloated budgets.

---

## 🌟 Features

- **📊 Portfolio Analysis**: Track your stock positions with current market data
- **📈 Performance Metrics**: Calculate CAGR (Compound Annual Growth Rate), alpha vs. benchmark, and inflation-adjusted returns
- **💰 Growth Visualization**: View performance as absolute returns or "Growth of $10,000" scenarios
- **⏱️ Time Range Filters**: Analyze your portfolio over 1Y, 3Y, 5Y, or Max timeframes
- **🔒 Privacy-First**: All portfolio data stays in your browser via localStorage—never sent to any server
- **💸 Zero-Cost Architecture**: Built entirely on free tiers (Cloudflare Workers, KV, Pages)
- **📥 CSV Import/Export**: Easy data portability with CSV support
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + Recharts
- **Backend**: Cloudflare Workers (Functions)
- **Data Cache**: Cloudflare KV (Key-Value Store)
- **Data Sources**: Google Sheets CSV + GitHub JSON
- **Deployment**: Cloudflare Pages
- **Testing**: Vitest

### The "Mega-Fetch" Pattern

BogleConvert uses a unique batching architecture to stay within free tier limits:

1. **Data Sources**: Admin maintains stock data in a Google Sheet (CSV) and/or GitHub JSON file
2. **Cache Layer**: Cloudflare Worker fetches and stores all supported tickers in a single KV key (`MASTER_PRICES`)
3. **Client Fetch**: Frontend fetches the entire dataset once per session
4. **Local Lookup**: All price lookups happen client-side in memory (no N+1 fetch loops)

This design ensures:
- ✅ Single network request per session
- ✅ Stays within Cloudflare Worker CPU limits
- ✅ Fast, responsive user experience
- ✅ No backend database required

### Privacy Model

- **User Portfolio Data**: Stored exclusively in browser localStorage
- **Market Data**: Fetched from Cloudflare KV cache (public data only)
- **No User Tracking**: No analytics, cookies, or server-side data collection
- **Email Protection**: Bitcoin donation email protected by Cloudflare Turnstile

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier)
- (Optional) Cloudflare Turnstile keys for email protection

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/BogleConvert/BogleConvert.git
   cd BogleConvert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.dev.vars` file in the project root. (See [Documentation/ENV_SETUP.md](./Documentation/ENV_SETUP.md) for details).
   
   ```bash
   # Frontend Variables
   VITE_GITHUB_REPO=https://github.com/BogleConvert/BogleConvert
   # ... other variables
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Test with demo data**
   
   Click "Load Demo" in the Settings view to populate the app with sample portfolio data.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npx vitest run --coverage
```

#### Test Suite Overview (19 Tests)

| Suite | Tests | What It Validates |
|-------|-------|-------------------|
| Financial Logic - Reality Checks | 5 | CAGR formula, inflation compounding, date handling |
| Portfolio Merge Logic | 5 | Weighted avg cost, share addition, years held weighting |
| Status Classification Thresholds | 4 | "Beating Inflation" / "Tracking Market" / "Losing Power" |
| Chart Data Generation | 5 | Year range, normalization, benchmark differentiation |

For complete test documentation, see [Documentation/TESTING.md](./Documentation/TESTING.md).

For financial accuracy audit, see [Documentation/AUDIT_MATH.md](./Documentation/AUDIT_MATH.md).

---

## 📦 Deployment

### Cloudflare Pages

1. **Connect your repository** to Cloudflare Pages
2. **Configure build settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Set environment variables** in the Cloudflare dashboard (see [ENV_SETUP.md](./Documentation/ENV_SETUP.md))
4. **Deploy** and monitor build logs

Your app will be available at `https://your-project.pages.dev` or your custom domain.

---

## 📖 Documentation

- **[ENV_SETUP.md](./Documentation/ENV_SETUP.md)** - Environment variable configuration guide
- **[TESTING.md](./Documentation/TESTING.md)** - Complete test suite documentation and coverage report
- **[AUDIT_MATH.md](./Documentation/AUDIT_MATH.md)** - Financial calculation verification and test results
- **[AUDIT_PRODUCTION.md](./Documentation/AUDIT_PRODUCTION.md)** - Production readiness audit and security review

---

## 🎯 Project Philosophy

BogleConvert follows the **Bogleheads investment philosophy**:

- **Simplicity**: Easy-to-use interface without complexity or jargon
- **Low Cost**: Built entirely on free tiers—zero infrastructure costs
- **Long-Term Focus**: Emphasizes CAGR and inflation-adjusted returns
- **Privacy**: Your financial data never leaves your device
- **Transparency**: Open-source code you can audit and trust

---

## 🤝 Contributing

Contributions are welcome!

> **Community First**
> 
> While the AGPL license grants you the freedom to fork, we believe this tool works best as a unified community resource. We strongly encourage you to contribute your features and bug fixes directly here. Fragmenting the user base hurts the accuracy of the tool—let's build *one* amazing calculator together.
>
> See `GOVERNANCE.md` for our legal pledge to keep this tool open and available forever.

1. **Report bugs** by opening an issue
2. **Suggest features** or improvements
3. **Submit pull requests** with bug fixes or enhancements
4. **Improve documentation** to help other users

Please ensure your code follows the existing style and includes appropriate tests.

---

## 💖 Support

If you find BogleConvert useful, consider supporting the project:

- **⭐ Star this repository** on GitHub
- **💳 Buy me a coffee** via Stripe
- **₿ Bitcoin donations** (email protected by Turnstile)
- **🛠️ Contribute code** or documentation

Visit the Support page in the app for donation options.

---

## 📄 License & Copyright

> **License:** AGPLv3 (See `LICENSE`)

**Copyright (c) 2026 Mid Michigan Connections LLC.**

## Maintainers

This project is maintained by **Mid Michigan Connections LLC**.

* **Dominic Nixon** - *Lead Architect* - [@DomNixon](https://github.com/DomNixon)

---

## 🙏 Acknowledgments

- **John C. Bogle** - For pioneering low-cost index investing and the Bogleheads philosophy
- **Cloudflare** - For providing generous free tiers that make this project possible
- **React, Vite, and Recharts communities** - For excellent open-source tools
- **Bogleheads Forum** - For promoting evidence-based investing education

---

## 📞 Contact

For questions or bug reports:

- **GitHub**: [Issues](https://github.com/BogleConvert/BogleConvert/issues)

---

**Disclaimer**: BogleConvert is a portfolio tracking tool for informational purposes only. It is not investment advice. Always consult a qualified financial advisor before making investment decisions. Past performance does not guarantee future results.

