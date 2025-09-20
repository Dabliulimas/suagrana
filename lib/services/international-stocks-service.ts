import { logComponents } from "../logger";
interface InternationalStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector?: string;
  exchange: string;
  country: string;
  currency: string;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: string;
}

interface APIResponse {
  bestMatches?: StockSearchResult[];
  "Global Quote"?: {
    "01. symbol": string;
    "05. price": string;
    "09. change": string;
    "10. change percent": string;
    "06. volume": string;
  };
}

class InternationalStocksService {
  private alphaVantageKey = "demo"; // Use demo key for now, replace with actual key
  private finnhubKey = "demo"; // Use demo key for now, replace with actual key
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for international stocks using Alpha Vantage API
   * Free tier: 5 API requests per minute and 500 requests per day
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      const cacheKey = `search_${query.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.alphaVantageKey}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: APIResponse = await response.json();
      const results = data.bestMatches || [];

      // Cache the results
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      logComponents.error("Error searching international stocks:", error);
      return [];
    }
  }

  /**
   * Get stock quote using Alpha Vantage API
   */
  async getStockQuote(symbol: string): Promise<InternationalStock | null> {
    try {
      const cacheKey = `quote_${symbol.toUpperCase()}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: APIResponse = await response.json();
      const quote = data["Global Quote"];

      if (!quote) {
        return null;
      }

      const stock: InternationalStock = {
        symbol: quote["01. symbol"],
        name: quote["01. symbol"], // Alpha Vantage doesn't provide company name in quote
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
        volume: parseInt(quote["06. volume"]),
        exchange: "US", // Assume US for now
        country: "US",
        currency: "USD",
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: stock,
        timestamp: Date.now(),
      });

      return stock;
    } catch (error) {
      logComponents.error("Error fetching stock quote:", error);
      return null;
    }
  }

  /**
   * Get multiple stock quotes at once
   */
  async getMultipleQuotes(symbols: string[]): Promise<InternationalStock[]> {
    const promises = symbols.map((symbol) => this.getStockQuote(symbol));
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result): result is PromisedFulfilled<InternationalStock> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value);
  }

  /**
   * Fallback search using Finnhub API (free tier: 60 API calls/minute)
   */
  async searchStocksFinnhub(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${this.finnhubKey}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      logComponents.error("Error searching stocks with Finnhub:", error);
      return [];
    }
  }

  /**
   * Get popular US stocks for quick access
   */
  getPopularUSStocks(): string[] {
    return [
      "AAPL",
      "MSFT",
      "GOOGL",
      "AMZN",
      "TSLA",
      "META",
      "NVDA",
      "NFLX",
      "JPM",
      "V",
      "MA",
      "JNJ",
      "WMT",
      "PG",
      "UNH",
      "HD",
      "DIS",
      "BAC",
      "ADBE",
      "CRM",
      "PYPL",
      "INTC",
      "AMD",
      "ORCL",
      "KO",
      "PEP",
      "NKE",
      "MCD",
      "SBUX",
      "UBER",
      "SPOT",
      "ZM",
      "BA",
      "CAT",
      "GE",
      "VZ",
      "T",
    ];
  }

  /**
   * Smart autocomplete that combines local database with API search
   */
  async smartAutocomplete(
    query: string,
    limit: number = 10,
  ): Promise<StockSearchResult[]> {
    if (query.length < 2) {
      return [];
    }

    try {
      // First, try to get results from API
      const apiResults = await this.searchStocks(query);

      // Filter and limit results
      const filteredResults = apiResults
        .filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, limit);

      return filteredResults;
    } catch (error) {
      logComponents.error("Error in smart autocomplete:", error);

      // Fallback to popular stocks if API fails
      const popularStocks = this.getPopularUSStocks();
      const matchingPopular = popularStocks
        .filter((symbol) => symbol.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map((symbol) => ({
          symbol,
          name: symbol, // We don't have names for fallback
          type: "Equity",
          region: "United States",
          marketOpen: "09:30",
          marketClose: "16:00",
          timezone: "UTC-04",
          currency: "USD",
          matchScore: "1.0000",
        }));

      return matchingPopular;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if a symbol is likely a US stock
   */
  isUSStock(symbol: string): boolean {
    // US stocks typically have 1-5 characters and no numbers
    return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
  }

  /**
   * Format stock symbol for display
   */
  formatSymbol(symbol: string, exchange?: string): string {
    const upperSymbol = symbol.toUpperCase();
    if (exchange && exchange !== "US") {
      return `${upperSymbol}:${exchange}`;
    }
    return upperSymbol;
  }

  /**
   * Get market status for US markets
   */
  getUSMarketStatus(): { isOpen: boolean; nextOpen?: Date; nextClose?: Date } {
    const now = new Date();
    const easternTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const hour = easternTime.getHours();
    const day = easternTime.getDay();

    // Check if it's weekend
    if (day === 0 || day === 6) {
      return { isOpen: false };
    }

    // Check if it's during market hours (9:30 AM - 4:00 PM ET)
    const isOpen = hour >= 9.5 && hour < 16;

    return { isOpen };
  }
}

export const internationalStocksService = new InternationalStocksService();
export type { InternationalStock, StockSearchResult };
