/**
 * Combined portfolio summary from GET /portfolio/summary
 */

export type AssetClassSummary = {
  count: number;
  total_cost_basis: string;
  total_market_value: string;
  total_gain_loss: string;
  portfolio_return_percentage: string;
};

export type CombinedPortfolioSummary = {
  cash_balance: string;
  stocks: AssetClassSummary;
  treasuries: AssetClassSummary;
  total_cost_basis: string;
  total_market_value: string;
  total_gain_loss: string;
  portfolio_return_percentage: string;
};
