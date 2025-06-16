 /**
 * Ticker Symbols Service with localStorage Caching
 * 
 * This service provides smart caching of ticker symbols with the following strategy:
 * 1. Check localStorage first (24-hour TTL)
 * 2. Fetch from API if cache is missing/expired
 * 3. Fallback to popular tickers if API fails
 * 4. Provide instant search/validation capabilities
 */

import { api } from './api';

interface TickerSymbolsCache {
  symbols: string[];
  timestamp: number;
  version: string;
}

const CACHE_KEY = 'ticker_symbols_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_VERSION = '1.0'; // Increment to invalidate old caches

class TickerSymbolsService {
  private symbols: string[] = [];
  private isLoading = false;
  private loadPromise: Promise<string[]> | null = null;

  /**
   * Get ticker symbols with smart caching
   */
  async getSymbols(forceRefresh = false): Promise<string[]> {
    // If we already have symbols and not forcing refresh, return them
    if (this.symbols.length > 0 && !forceRefresh) {
      return this.symbols;
    }

    // If already loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.loadSymbolsInternal(forceRefresh);

    try {
      this.symbols = await this.loadPromise;
      return this.symbols;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Internal method to load symbols with caching logic
   */
  private async loadSymbolsInternal(forceRefresh: boolean): Promise<string[]> {
    try {
      // Step 1: Check localStorage cache (unless forcing refresh)
      if (!forceRefresh) {
        const cachedSymbols = this.getCachedSymbols();
        if (cachedSymbols) {
          console.log(`✅ Loaded ${cachedSymbols.length} ticker symbols from localStorage`);
          return cachedSymbols;
        }
      }

      // Step 2: Fetch from API
      console.log('📡 Fetching ticker symbols from API...');
      const apiSymbols = await api.getTickerSymbols(forceRefresh);
      
      if (apiSymbols && apiSymbols.length > 0) {
        // Cache the symbols
        this.setCachedSymbols(apiSymbols);
        console.log(`✅ Loaded ${apiSymbols.length} ticker symbols from API and cached`);
        return apiSymbols;
      }

      // Step 3: Fallback to popular symbols
      console.warn('⚠️  API returned no symbols, using popular symbols fallback');
      const popularSymbols = await api.getPopularTickerSymbols();
      return popularSymbols;

    } catch (error) {
      console.error('❌ Error loading ticker symbols:', error);
      
      // Step 4: Try cached symbols even if expired
      const expiredCache = this.getCachedSymbols(true);
      if (expiredCache) {
        console.log(`⚠️  Using expired cache: ${expiredCache.length} symbols`);
        return expiredCache;
      }

      // Step 5: Final fallback to popular symbols
      try {
        const popularSymbols = await api.getPopularTickerSymbols();
        console.log(`⚠️  Using popular symbols fallback: ${popularSymbols.length} symbols`);
        return popularSymbols;
      } catch (fallbackError) {
        console.error('❌ Even popular symbols fallback failed:', fallbackError);
        return this.getHardcodedFallback();
      }
    }
  }

  /**
   * Get cached symbols from localStorage
   */
  private getCachedSymbols(ignoreExpiry = false): string[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: TickerSymbolsCache = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheData.version !== CACHE_VERSION) {
        console.log('🔄 Cache version mismatch, invalidating');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // Check expiry (unless ignoring)
      if (!ignoreExpiry) {
        const now = Date.now();
        const age = now - cacheData.timestamp;
        
        if (age > CACHE_TTL) {
          console.log('⏰ Cache expired, will refresh');
          return null;
        }
      }

      return cacheData.symbols;
    } catch (error) {
      console.error('❌ Error reading ticker symbols cache:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  /**
   * Cache symbols to localStorage
   */
  private setCachedSymbols(symbols: string[]): void {
    try {
      const cacheData: TickerSymbolsCache = {
        symbols,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`💾 Cached ${symbols.length} ticker symbols to localStorage`);
    } catch (error) {
      console.error('❌ Error caching ticker symbols:', error);
    }
  }

  /**
   * Validate if a ticker symbol exists
   */
  async isValidTicker(symbol: string): Promise<boolean> {
    const symbols = await this.getSymbols();
    return symbols.includes(symbol.toUpperCase());
  }

  /**
   * Search ticker symbols with fuzzy matching
   */
  async searchTickers(query: string, limit = 10): Promise<string[]> {
    if (!query || query.length < 1) return [];

    const symbols = await this.getSymbols();
    const upperQuery = query.toUpperCase();

    // Exact matches first
    const exactMatches = symbols.filter(symbol => symbol === upperQuery);
    
    // Starts with matches
    const startsWithMatches = symbols.filter(symbol => 
      symbol.startsWith(upperQuery) && symbol !== upperQuery
    );
    
    // Contains matches
    const containsMatches = symbols.filter(symbol => 
      symbol.includes(upperQuery) && 
      !symbol.startsWith(upperQuery) && 
      symbol !== upperQuery
    );

    // Combine and limit results
    const results = [
      ...exactMatches,
      ...startsWithMatches.slice(0, limit - exactMatches.length),
      ...containsMatches.slice(0, limit - exactMatches.length - startsWithMatches.length)
    ];

    return results.slice(0, limit);
  }

  /**
   * Get popular ticker symbols (quick access)
   */
  async getPopularTickers(): Promise<string[]> {
    try {
      return await api.getPopularTickerSymbols();
    } catch (error) {
      console.error('❌ Error fetching popular tickers:', error);
      return this.getHardcodedFallback();
    }
  }

  /**
   * Force refresh symbols from API
   */
  async refreshSymbols(): Promise<string[]> {
    return this.getSymbols(true);
  }

  /**
   * Get cache statistics
   */
  getCacheInfo(): {
    cached: boolean;
    count: number;
    age: string;
    size: string;
  } {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return {
          cached: false,
          count: 0,
          age: 'Not cached',
          size: '0 KB'
        };
      }

      const cacheData: TickerSymbolsCache = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;
      const ageHours = Math.floor(age / (1000 * 60 * 60));
      const ageMinutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        cached: true,
        count: cacheData.symbols.length,
        age: `${ageHours}h ${ageMinutes}m ago`,
        size: `${Math.round(cached.length / 1024)} KB`
      };
    } catch (error) {
      return {
        cached: false,
        count: 0,
        age: 'Error',
        size: '0 KB'
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
    this.symbols = [];
    console.log('🗑️  Ticker symbols cache cleared');
  }

  /**
   * Hardcoded fallback for extreme failure cases
   */
  private getHardcodedFallback(): string[] {
    return [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
      'JPM', 'BAC', 'WFC', 'GS', 'JNJ', 'PFE', 'UNH', 'KO', 'PEP',
      'WMT', 'HD', 'MCD', 'BA', 'CAT', 'XOM', 'CVX', 'SPY', 'QQQ'
    ];
  }

  /**
   * Preload symbols in background (call on app startup)
   */
  async preloadSymbols(): Promise<void> {
    try {
      await this.getSymbols();
      console.log('✅ Ticker symbols preloaded successfully');
    } catch (error) {
      console.error('⚠️  Failed to preload ticker symbols:', error);
    }
  }
}

// Export singleton instance
export const tickerSymbolsService = new TickerSymbolsService();

// Export for testing
export { TickerSymbolsService };