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

export interface StockPosition {
  ticker: string;
  name: string;
  avgCost: number;
  currentPrice: number;
  shares: number;
  yearsHeld: number;
  nominalReturn: number;
  inflationAdjReturn: number;
  status: 'Beating Inflation' | 'Tracking Market' | 'Losing Power';
  sector: string;
  weight: number;
  cagr: number;
  lastUpdated?: string;
}

export interface ChartDataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
  inflation: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  twoFactorEnabled?: boolean;
}

export enum ViewState {
  DASHBOARD = 'dashboard',
  PORTFOLIO = 'portfolio',
  ANALYSIS = 'analysis',
  SETTINGS = 'settings',
  REPORT = 'report', // The stock detail view
  PHILOSOPHY = 'philosophy',
  SUPPORT = 'support'
}
