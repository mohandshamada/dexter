/**
 * Financial Provider Interface
 *
 * Defines the contract for financial data providers.
 * Implementations can use different data sources (FinancialDatasets, Yahoo Finance, etc.)
 */

export interface FinancialStatementsParams {
  ticker: string;
  period: 'annual' | 'quarterly' | 'ttm';
  limit?: number;
  report_period_gt?: string;
  report_period_gte?: string;
  report_period_lt?: string;
  report_period_lte?: string;
}

export interface PriceParams {
  ticker: string;
  date?: string;
}

export interface PriceHistoryParams {
  ticker: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface MetricsParams {
  ticker: string;
  period?: 'annual' | 'quarterly' | 'ttm';
  limit?: number;
}

export interface NewsParams {
  ticker?: string;
  query?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface EstimatesParams {
  ticker: string;
  period?: 'annual' | 'quarterly';
  limit?: number;
}

export interface InsiderTradesParams {
  ticker: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface FilingsParams {
  ticker: string;
  form_type?: string[];
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface ProviderResponse<T = any> {
  data: T;
  source: string; // URL or identifier of data source
}

/**
 * Interface for financial data providers
 */
export interface IFinancialProvider {
  // Provider identification
  readonly name: string;
  readonly requiresApiKey: boolean;

  // Initialization
  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;

  // Financial Statements
  getIncomeStatements(params: FinancialStatementsParams): Promise<ProviderResponse>;
  getBalanceSheets(params: FinancialStatementsParams): Promise<ProviderResponse>;
  getCashFlowStatements(params: FinancialStatementsParams): Promise<ProviderResponse>;
  getAllFinancialStatements(params: FinancialStatementsParams): Promise<ProviderResponse>;

  // Price Data
  getPriceSnapshot(params: PriceParams): Promise<ProviderResponse>;
  getPriceHistory(params: PriceHistoryParams): Promise<ProviderResponse>;

  // Financial Metrics
  getFinancialMetrics(params: MetricsParams): Promise<ProviderResponse>;

  // Optional features (may not be supported by all providers)
  getNews?(params: NewsParams): Promise<ProviderResponse>;
  getAnalystEstimates?(params: EstimatesParams): Promise<ProviderResponse>;
  getInsiderTrades?(params: InsiderTradesParams): Promise<ProviderResponse>;
  getFilings?(params: FilingsParams): Promise<ProviderResponse>;
  getSegmentedRevenues?(params: FinancialStatementsParams): Promise<ProviderResponse>;
}

/**
 * Base class for financial providers with common utilities
 */
export abstract class BaseFinancialProvider implements IFinancialProvider {
  abstract readonly name: string;
  abstract readonly requiresApiKey: boolean;

  async initialize(): Promise<void> {
    // Default implementation - can be overridden
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }

  // Abstract methods that must be implemented
  abstract getIncomeStatements(params: FinancialStatementsParams): Promise<ProviderResponse>;
  abstract getBalanceSheets(params: FinancialStatementsParams): Promise<ProviderResponse>;
  abstract getCashFlowStatements(params: FinancialStatementsParams): Promise<ProviderResponse>;
  abstract getAllFinancialStatements(params: FinancialStatementsParams): Promise<ProviderResponse>;
  abstract getPriceSnapshot(params: PriceParams): Promise<ProviderResponse>;
  abstract getPriceHistory(params: PriceHistoryParams): Promise<ProviderResponse>;
  abstract getFinancialMetrics(params: MetricsParams): Promise<ProviderResponse>;
}
