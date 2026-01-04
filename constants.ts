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

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const COLORS = {
  primary: "#6e5de9",
  secondary: "#13a4ec",
  positive: "#0ab88b",
  negative: "#e03131",
  chart: {
    portfolio: "#3b82f6",
    benchmark: "#6b7280",
    inflation: "#63e6be"
  }
};

export const DEFAULT_BENCHMARK: 'VT' | 'VTI' | 'VOO' = 'VT';
export const DEFAULT_REPORT_TICKER = 'AAPL';
export const LAST_DATA_YEAR = 2026;

// Approximate Historical US Inflation Rates (CPI-U, Year-over-Year)
export const HISTORICAL_INFLATION_RATES: { year: number; rate: number }[] = [
  { year: 1924, rate: 0.0 }, { year: 1925, rate: 2.3 }, { year: 1926, rate: 1.1 }, { year: 1927, rate: -1.7 }, { year: 1928, rate: -1.7 },
  { year: 1929, rate: 0.0 }, { year: 1930, rate: -2.3 }, { year: 1931, rate: -9.0 }, { year: 1932, rate: -9.9 }, { year: 1933, rate: -5.1 },
  { year: 1934, rate: 3.1 }, { year: 1935, rate: 2.2 }, { year: 1936, rate: 1.5 }, { year: 1937, rate: 3.6 }, { year: 1938, rate: -2.1 },
  { year: 1939, rate: -1.4 }, { year: 1940, rate: 0.7 }, { year: 1941, rate: 5.0 }, { year: 1942, rate: 10.9 }, { year: 1943, rate: 6.1 },
  { year: 1944, rate: 1.7 }, { year: 1945, rate: 2.3 }, { year: 1946, rate: 8.3 }, { year: 1947, rate: 14.4 }, { year: 1948, rate: 8.1 },
  { year: 1949, rate: -1.2 }, { year: 1950, rate: 1.3 }, { year: 1951, rate: 7.9 }, { year: 1952, rate: 1.9 }, { year: 1953, rate: 0.8 },
  { year: 1954, rate: 0.7 }, { year: 1955, rate: -0.4 }, { year: 1956, rate: 1.5 }, { year: 1957, rate: 3.3 }, { year: 1958, rate: 2.8 },
  { year: 1959, rate: 0.7 }, { year: 1960, rate: 1.7 }, { year: 1961, rate: 1.0 }, { year: 1962, rate: 1.0 }, { year: 1963, rate: 1.3 },
  { year: 1964, rate: 1.3 }, { year: 1965, rate: 1.6 }, { year: 1966, rate: 2.9 }, { year: 1967, rate: 3.1 }, { year: 1968, rate: 4.2 },
  { year: 1969, rate: 5.5 }, { year: 1970, rate: 5.7 }, { year: 1971, rate: 4.4 }, { year: 1972, rate: 3.2 }, { year: 1973, rate: 6.2 },
  { year: 1974, rate: 11.0 }, { year: 1975, rate: 9.1 }, { year: 1976, rate: 5.8 }, { year: 1977, rate: 6.5 }, { year: 1978, rate: 7.6 },
  { year: 1979, rate: 11.3 }, { year: 1980, rate: 13.5 }, { year: 1981, rate: 10.3 }, { year: 1982, rate: 6.2 }, { year: 1983, rate: 3.2 },
  { year: 1984, rate: 4.3 }, { year: 1985, rate: 3.6 }, { year: 1986, rate: 1.9 }, { year: 1987, rate: 3.6 }, { year: 1988, rate: 4.1 },
  { year: 1989, rate: 4.8 }, { year: 1990, rate: 5.4 }, { year: 1991, rate: 4.2 }, { year: 1992, rate: 3.0 }, { year: 1993, rate: 3.0 },
  { year: 1994, rate: 2.6 }, { year: 1995, rate: 2.8 }, { year: 1996, rate: 3.0 }, { year: 1997, rate: 2.3 }, { year: 1998, rate: 1.6 },
  { year: 1999, rate: 2.2 }, { year: 2000, rate: 3.4 }, { year: 2001, rate: 2.8 }, { year: 2002, rate: 1.6 }, { year: 2003, rate: 2.3 },
  { year: 2004, rate: 2.7 }, { year: 2005, rate: 3.4 }, { year: 2006, rate: 3.2 }, { year: 2007, rate: 2.8 }, { year: 2008, rate: 3.8 },
  { year: 2009, rate: -0.4 }, { year: 2010, rate: 1.6 }, { year: 2011, rate: 3.2 }, { year: 2012, rate: 2.1 }, { year: 2013, rate: 1.5 },
  { year: 2014, rate: 1.6 }, { year: 2015, rate: 0.1 }, { year: 2016, rate: 1.3 }, { year: 2017, rate: 2.1 }, { year: 2018, rate: 2.4 },
  { year: 2019, rate: 1.8 }, { year: 2020, rate: 1.2 }, { year: 2021, rate: 4.7 }, { year: 2022, rate: 8.0 }, { year: 2023, rate: 3.4 },
  { year: 2024, rate: 2.6 }, { year: 2025, rate: 2.7 }, { year: 2026, rate: 2.6 } // 2025: BLS actual, 2026: Federal Reserve/Trading Economics forecast
];

// Approximate VT (Vanguard Total World Stock ETF) Annual Returns
export const VT_ANNUAL_RETURNS: { year: number; return: number }[] = [
  { year: 2008, return: -42.0 },
  { year: 2009, return: 32.7 },
  { year: 2010, return: 12.8 },
  { year: 2011, return: -6.4 },
  { year: 2012, return: 16.7 },
  { year: 2013, return: 22.8 },
  { year: 2014, return: 4.0 },
  { year: 2015, return: -1.9 },
  { year: 2016, return: 8.7 },
  { year: 2017, return: 24.0 },
  { year: 2018, return: -9.8 },
  { year: 2019, return: 26.9 },
  { year: 2020, return: 16.3 },
  { year: 2021, return: 18.0 },
  { year: 2022, return: -18.0 },
  { year: 2023, return: 22.0 },
  { year: 2024, return: 18.2 },
  { year: 2025, return: 15.5 }, // 2025 actual full-year return
  { year: 2026, return: 8.0 }, // 2026 YTD estimate (conservative)
];

// Approximate VTI (Vanguard Total Stock Market ETF) Annual Returns
export const VTI_ANNUAL_RETURNS: { year: number; return: number }[] = [
  { year: 2008, return: -37.0 },
  { year: 2009, return: 28.8 },
  { year: 2010, return: 17.3 },
  { year: 2011, return: 1.0 },
  { year: 2012, return: 16.4 },
  { year: 2013, return: 33.5 },
  { year: 2014, return: 12.6 },
  { year: 2015, return: 0.3 },
  { year: 2016, return: 12.6 },
  { year: 2017, return: 21.2 },
  { year: 2018, return: -5.2 },
  { year: 2019, return: 30.8 },
  { year: 2020, return: 21.0 },
  { year: 2021, return: 25.7 },
  { year: 2022, return: -19.5 },
  { year: 2023, return: 26.1 },
  { year: 2024, return: 22.4 },
  { year: 2025, return: 23.5 }, // 2025 actual full-year return
  { year: 2026, return: 10.0 }, // 2026 YTD estimate (conservative)
];

// Approximate VOO (Vanguard S&P 500 ETF) Annual Returns
export const VOO_ANNUAL_RETURNS: { year: number; return: number }[] = [
  { year: 2008, return: -37.0 },
  { year: 2009, return: 26.5 },
  { year: 2010, return: 15.1 },
  { year: 2011, return: 2.1 },
  { year: 2012, return: 16.0 },
  { year: 2013, return: 32.4 },
  { year: 2014, return: 13.7 },
  { year: 2015, return: 1.4 },
  { year: 2016, return: 12.0 },
  { year: 2017, return: 21.8 },
  { year: 2018, return: -4.4 },
  { year: 2019, return: 31.5 },
  { year: 2020, return: 18.4 },
  { year: 2021, return: 28.7 },
  { year: 2022, return: -18.1 },
  { year: 2023, return: 26.3 },
  { year: 2024, return: 25.0 },
  { year: 2025, return: 23.8 }, // 2025 actual full-year return
  { year: 2026, return: 10.5 }, // 2026 YTD estimate (conservative)
];
