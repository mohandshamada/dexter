import type { IFinancialProvider } from '../interfaces/index.js';
import { FinancialDatasetsProvider } from './financial-datasets-provider.js';
import { YahooFinanceProvider } from './yahoo-finance-provider.js';

export { FinancialDatasetsProvider } from './financial-datasets-provider.js';
export { YahooFinanceProvider } from './yahoo-finance-provider.js';

export type ProviderType = 'financialdatasets' | 'yahoo';

/**
 * Factory function to create a financial data provider based on configuration
 */
export function createFinancialProvider(
  providerType?: ProviderType | string
): IFinancialProvider {
  const type = providerType || process.env.FINANCIAL_PROVIDER || 'financialdatasets';

  switch (type.toLowerCase()) {
    case 'yahoo':
    case 'yahoo-finance':
      return new YahooFinanceProvider();

    case 'financialdatasets':
    case 'financial-datasets':
    default:
      return new FinancialDatasetsProvider();
  }
}

/**
 * Get the default financial provider
 */
export function getDefaultProvider(): IFinancialProvider {
  return createFinancialProvider();
}
