
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
