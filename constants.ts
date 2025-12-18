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
