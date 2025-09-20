import { logComponents } from "../logger";
interface BrapiStock {
  stock: string;
  name: string;
  close: number;
  change: number;
  volume: number;
  market_cap: number;
  logo: string;
  sector: string;
  type: string;
}

interface BrapiResponse {
  results: BrapiStock[];
  requestedAt: string;
  took: string;
}

class BrapiService {
  private baseUrl = "https://brapi.dev/api";
  private cache = new Map<string, { data: BrapiStock; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async searchStock(ticker: string): Promise<BrapiStock | null> {
    try {
      // Check cache first
      const cached = this.cache.get(ticker.toUpperCase());
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(
        `${this.baseUrl}/quote/${ticker}?token=demo`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BrapiResponse = await response.json();

      if (data.results && data.results.length > 0) {
        const stock = data.results[0];

        // Cache the result
        this.cache.set(ticker.toUpperCase(), {
          data: stock,
          timestamp: Date.now(),
        });

        return stock;
      }

      return null;
    } catch (error) {
      logComponents.error("Error fetching stock data:", error);
      return null;
    }
  }

  async getMultipleStocks(tickers: string[]): Promise<BrapiStock[]> {
    try {
      const tickerList = tickers.join(",");
      const response = await fetch(
        `${this.baseUrl}/quote/${tickerList}?token=demo`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BrapiResponse = await response.json();

      if (data.results) {
        // Cache all results
        data.results.forEach((stock) => {
          this.cache.set(stock.stock, {
            data: stock,
            timestamp: Date.now(),
          });
        });

        return data.results;
      }

      return [];
    } catch (error) {
      logComponents.error("Error fetching multiple stocks:", error);
      return [];
    }
  }

  async getAvailableStocks(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/available?token=demo`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.stocks || [];
    } catch (error) {
      logComponents.error("Error fetching available stocks:", error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const brapiService = new BrapiService();
export type { BrapiStock };
