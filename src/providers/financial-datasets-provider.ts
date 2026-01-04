import {
  BaseFinancialProvider,
  type FinancialStatementsParams,
  type PriceParams,
  type PriceHistoryParams,
  type MetricsParams,
  type NewsParams,
  type EstimatesParams,
  type InsiderTradesParams,
  type FilingsParams,
  type ProviderResponse,
} from '../interfaces/index.js';
import { getCache, type CacheService } from '../cache/index.js';

const BASE_URL = 'https://api.financialdatasets.ai';

interface ApiResponse {
  data: Record<string, unknown>;
  url: string;
}

/**
 * Financial data provider that uses the FinancialDatasets.ai API
 */
export class FinancialDatasetsProvider extends BaseFinancialProvider {
  readonly name = 'FinancialDatasets';
  readonly requiresApiKey = true;

  private apiKey: string | undefined;
  private cache: CacheService;
  private enableCache: boolean;

  constructor(apiKey?: string, enableCache: boolean = true) {
    super();
    this.apiKey = apiKey || process.env.FINANCIAL_DATASETS_API_KEY;
    this.cache = getCache();
    this.enableCache = enableCache && (process.env.DISABLE_CACHE !== 'true');
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('FINANCIAL_DATASETS_API_KEY is required for FinancialDatasetsProvider');
    }
  }

  private async callApi(
    endpoint: string,
    params: Record<string, string | number | string[] | undefined>
  ): Promise<ApiResponse> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    // Check cache first
    const cacheKey = `financialdatasets_${endpoint}`;
    if (this.enableCache) {
      const cached = this.cache.get<ApiResponse>(cacheKey, params);
      if (cached) {
        return cached;
      }
    }

    const url = new URL(`${BASE_URL}${endpoint}`);

    // Add params to URL, handling arrays
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = { data, url: url.toString() };

    // Cache the result
    if (this.enableCache) {
      this.cache.set(cacheKey, params, result);
    }

    return result;
  }

  private createFinancialStatementsParams(
    params: FinancialStatementsParams
  ): Record<string, string | number | undefined> {
    return {
      ticker: params.ticker,
      period: params.period,
      limit: params.limit,
      report_period_gt: params.report_period_gt,
      report_period_gte: params.report_period_gte,
      report_period_lt: params.report_period_lt,
      report_period_lte: params.report_period_lte,
    };
  }

  async getIncomeStatements(params: FinancialStatementsParams): Promise<ProviderResponse> {
    const apiParams = this.createFinancialStatementsParams(params);
    const { data, url } = await this.callApi('/financials/income-statements/', apiParams);
    return { data: data.income_statements || {}, source: url };
  }

  async getBalanceSheets(params: FinancialStatementsParams): Promise<ProviderResponse> {
    const apiParams = this.createFinancialStatementsParams(params);
    const { data, url } = await this.callApi('/financials/balance-sheets/', apiParams);
    return { data: data.balance_sheets || {}, source: url };
  }

  async getCashFlowStatements(params: FinancialStatementsParams): Promise<ProviderResponse> {
    const apiParams = this.createFinancialStatementsParams(params);
    const { data, url } = await this.callApi('/financials/cash-flow-statements/', apiParams);
    return { data: data.cash_flow_statements || {}, source: url };
  }

  async getAllFinancialStatements(params: FinancialStatementsParams): Promise<ProviderResponse> {
    const apiParams = this.createFinancialStatementsParams(params);
    const { data, url } = await this.callApi('/financials/', apiParams);
    return { data: data.financials || {}, source: url };
  }

  async getPriceSnapshot(params: PriceParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/prices/', {
      ticker: params.ticker,
      date: params.date,
    });
    return { data: data.prices || {}, source: url };
  }

  async getPriceHistory(params: PriceHistoryParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/prices/', {
      ticker: params.ticker,
      start_date: params.start_date,
      end_date: params.end_date,
      limit: params.limit,
    });
    return { data: data.prices || {}, source: url };
  }

  async getFinancialMetrics(params: MetricsParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/financials/metrics/', {
      ticker: params.ticker,
      period: params.period,
      limit: params.limit,
    });
    return { data: data.metrics || {}, source: url };
  }

  async getNews(params: NewsParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/news/', {
      ticker: params.ticker,
      query: params.query,
      start_date: params.start_date,
      end_date: params.end_date,
      limit: params.limit,
    });
    return { data: data.news || {}, source: url };
  }

  async getAnalystEstimates(params: EstimatesParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/analyst-estimates/', {
      ticker: params.ticker,
      period: params.period,
      limit: params.limit,
    });
    return { data: data.analyst_estimates || {}, source: url };
  }

  async getInsiderTrades(params: InsiderTradesParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/insider-trades/', {
      ticker: params.ticker,
      start_date: params.start_date,
      end_date: params.end_date,
      limit: params.limit,
    });
    return { data: data.insider_trades || {}, source: url };
  }

  async getFilings(params: FilingsParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/filings/', {
      ticker: params.ticker,
      form_type: params.form_type,
      start_date: params.start_date,
      end_date: params.end_date,
      limit: params.limit,
    });
    return { data: data.filings || {}, source: url };
  }

  async getSegmentedRevenues(params: FinancialStatementsParams): Promise<ProviderResponse> {
    const { data, url } = await this.callApi('/segments/', {
      ticker: params.ticker,
      period: params.period,
      limit: params.limit,
    });
    return { data: data.segments || {}, source: url };
  }
}
