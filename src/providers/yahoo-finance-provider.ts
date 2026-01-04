import yahooFinance from 'yahoo-finance2';
import {
  BaseFinancialProvider,
  type FinancialStatementsParams,
  type PriceParams,
  type PriceHistoryParams,
  type MetricsParams,
  type NewsParams,
  type ProviderResponse,
} from '../interfaces/index.js';

/**
 * Financial data provider that uses Yahoo Finance (free, no API key required)
 */
export class YahooFinanceProvider extends BaseFinancialProvider {
  readonly name = 'Yahoo Finance';
  readonly requiresApiKey = false;

  async initialize(): Promise<void> {
    // Yahoo Finance doesn't require initialization
  }

  private formatPeriod(period: 'annual' | 'quarterly' | 'ttm'): 'annual' | 'quarterly' {
    // Yahoo Finance doesn't have TTM, map to quarterly
    return period === 'annual' ? 'annual' : 'quarterly';
  }

  async getIncomeStatements(params: FinancialStatementsParams): Promise<ProviderResponse> {
    try {
      const quoteSummary = await yahooFinance.quoteSummary(params.ticker, {
        modules: ['incomeStatementHistory', 'incomeStatementHistoryQuarterly'],
      });

      const period = this.formatPeriod(params.period);
      const statements =
        period === 'annual'
          ? quoteSummary.incomeStatementHistory?.incomeStatementHistory
          : quoteSummary.incomeStatementHistoryQuarterly?.incomeStatementHistory;

      const limited = statements?.slice(0, params.limit || 10) || [];

      return {
        data: { income_statements: limited },
        source: `yahoo-finance:${params.ticker}:income-statements:${period}`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }

  async getBalanceSheets(params: FinancialStatementsParams): Promise<ProviderResponse> {
    try {
      const quoteSummary = await yahooFinance.quoteSummary(params.ticker, {
        modules: ['balanceSheetHistory', 'balanceSheetHistoryQuarterly'],
      });

      const period = this.formatPeriod(params.period);
      const statements =
        period === 'annual'
          ? quoteSummary.balanceSheetHistory?.balanceSheetStatements
          : quoteSummary.balanceSheetHistoryQuarterly?.balanceSheetStatements;

      const limited = statements?.slice(0, params.limit || 10) || [];

      return {
        data: { balance_sheets: limited },
        source: `yahoo-finance:${params.ticker}:balance-sheets:${period}`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }

  async getCashFlowStatements(params: FinancialStatementsParams): Promise<ProviderResponse> {
    try {
      const quoteSummary = await yahooFinance.quoteSummary(params.ticker, {
        modules: ['cashflowStatementHistory', 'cashflowStatementHistoryQuarterly'],
      });

      const period = this.formatPeriod(params.period);
      const statements =
        period === 'annual'
          ? quoteSummary.cashflowStatementHistory?.cashflowStatements
          : quoteSummary.cashflowStatementHistoryQuarterly?.cashflowStatements;

      const limited = statements?.slice(0, params.limit || 10) || [];

      return {
        data: { cash_flow_statements: limited },
        source: `yahoo-finance:${params.ticker}:cash-flow:${period}`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }

  async getAllFinancialStatements(params: FinancialStatementsParams): Promise<ProviderResponse> {
    // Fetch all three statements in parallel
    const [incomeStmts, balanceSheets, cashFlows] = await Promise.all([
      this.getIncomeStatements(params),
      this.getBalanceSheets(params),
      this.getCashFlowStatements(params),
    ]);

    return {
      data: {
        income_statements: incomeStmts.data.income_statements,
        balance_sheets: balanceSheets.data.balance_sheets,
        cash_flow_statements: cashFlows.data.cash_flow_statements,
      },
      source: `yahoo-finance:${params.ticker}:all-statements:${params.period}`,
    };
  }

  async getPriceSnapshot(params: PriceParams): Promise<ProviderResponse> {
    try {
      const quote = await yahooFinance.quote(params.ticker);

      return {
        data: {
          prices: [
            {
              ticker: params.ticker,
              date: params.date || new Date().toISOString().split('T')[0],
              price: quote.regularMarketPrice,
              open: quote.regularMarketOpen,
              high: quote.regularMarketDayHigh,
              low: quote.regularMarketDayLow,
              close: quote.regularMarketPrice,
              volume: quote.regularMarketVolume,
            },
          ],
        },
        source: `yahoo-finance:${params.ticker}:price-snapshot`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }

  async getPriceHistory(params: PriceHistoryParams): Promise<ProviderResponse> {
    try {
      const queryOptions: any = {
        period1: params.start_date || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period2: params.end_date || new Date().toISOString().split('T')[0],
      };

      const history = await yahooFinance.historical(params.ticker, queryOptions);

      const limited = history.slice(0, params.limit || history.length);

      const prices = limited.map((h) => ({
        ticker: params.ticker,
        date: h.date.toISOString().split('T')[0],
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume,
      }));

      return {
        data: { prices },
        source: `yahoo-finance:${params.ticker}:price-history`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }

  async getFinancialMetrics(params: MetricsParams): Promise<ProviderResponse> {
    try {
      const quoteSummary = await yahooFinance.quoteSummary(params.ticker, {
        modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'],
      });

      const metrics = {
        pe_ratio: quoteSummary.summaryDetail?.trailingPE,
        forward_pe: quoteSummary.summaryDetail?.forwardPE,
        peg_ratio: quoteSummary.defaultKeyStatistics?.pegRatio,
        price_to_book: quoteSummary.defaultKeyStatistics?.priceToBook,
        price_to_sales: quoteSummary.summaryDetail?.priceToSalesTrailing12Months,
        profit_margin: quoteSummary.financialData?.profitMargins,
        operating_margin: quoteSummary.financialData?.operatingMargins,
        roe: quoteSummary.financialData?.returnOnEquity,
        roa: quoteSummary.financialData?.returnOnAssets,
        debt_to_equity: quoteSummary.financialData?.debtToEquity,
        current_ratio: quoteSummary.financialData?.currentRatio,
        quick_ratio: quoteSummary.financialData?.quickRatio,
      };

      return {
        data: { metrics: [metrics] },
        source: `yahoo-finance:${params.ticker}:metrics`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }

  async getNews(params: NewsParams): Promise<ProviderResponse> {
    try {
      if (!params.ticker) {
        throw new Error('Ticker is required for Yahoo Finance news');
      }

      const news = await yahooFinance.search(params.ticker, {
        newsCount: params.limit || 10,
      });

      return {
        data: { news: news.news || [] },
        source: `yahoo-finance:${params.ticker}:news`,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error}`);
    }
  }
}
