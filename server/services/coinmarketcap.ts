// CoinMarketCap API integration for cryptocurrency data
export class CoinMarketCapService {
  private apiKey: string;
  private baseUrl: string;
  private sandboxUrl: string;

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    this.baseUrl = 'https://pro-api.coinmarketcap.com/v1';
    this.sandboxUrl = 'https://sandbox-api.coinmarketcap.com/v1';
  }

  // Get latest cryptocurrency listings
  async getLatestListings(limit: number = 100, convert: string = 'USD'): Promise<any> {
    const url = `${this.getApiUrl()}/cryptocurrency/listings/latest`;
    const params = new URLSearchParams({
      start: '1',
      limit: limit.toString(),
      convert: convert
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get specific cryptocurrency quotes
  async getCryptocurrencyQuotes(symbols: string[], convert: string = 'USD'): Promise<any> {
    const url = `${this.getApiUrl()}/cryptocurrency/quotes/latest`;
    const params = new URLSearchParams({
      symbol: symbols.join(','),
      convert: convert
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get cryptocurrency metadata
  async getCryptocurrencyInfo(symbols: string[]): Promise<any> {
    const url = `${this.getApiUrl()}/cryptocurrency/info`;
    const params = new URLSearchParams({
      symbol: symbols.join(',')
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get global cryptocurrency metrics
  async getGlobalMetrics(convert: string = 'USD'): Promise<any> {
    const url = `${this.getApiUrl()}/global-metrics/quotes/latest`;
    const params = new URLSearchParams({
      convert: convert
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get trending cryptocurrencies (gainers/losers)
  async getTrendingCryptocurrencies(limit: number = 10, time_period: string = '24h'): Promise<any> {
    const url = `${this.getApiUrl()}/cryptocurrency/trending/gainers-losers`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      time_period: time_period,
      convert: 'USD'
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get cryptocurrency historical data
  async getHistoricalQuotes(
    symbol: string, 
    time_start?: string, 
    time_end?: string, 
    count?: number,
    convert: string = 'USD'
  ): Promise<any> {
    const url = `${this.getApiUrl()}/cryptocurrency/quotes/historical`;
    const params = new URLSearchParams({
      symbol: symbol,
      convert: convert
    });

    if (time_start) params.append('time_start', time_start);
    if (time_end) params.append('time_end', time_end);
    if (count) params.append('count', count.toString());

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get exchange listings
  async getExchangeListings(limit: number = 100): Promise<any> {
    const url = `${this.getApiUrl()}/exchange/listings/latest`;
    const params = new URLSearchParams({
      start: '1',
      limit: limit.toString()
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get market pairs for a cryptocurrency
  async getMarketPairs(symbol: string, limit: number = 100): Promise<any> {
    const url = `${this.getApiUrl()}/cryptocurrency/market-pairs/latest`;
    const params = new URLSearchParams({
      symbol: symbol,
      limit: limit.toString()
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Convert between cryptocurrencies and fiat
  async convertCurrency(
    amount: number,
    symbol: string,
    convert: string = 'USD'
  ): Promise<any> {
    const url = `${this.getApiUrl()}/tools/price-conversion`;
    const params = new URLSearchParams({
      amount: amount.toString(),
      symbol: symbol,
      convert: convert
    });

    const response = await this.fetchWithKey(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to determine API URL (sandbox vs production)
  private getApiUrl(): string {
    // Use sandbox if no API key is provided or if explicitly set to sandbox
    return this.apiKey && this.apiKey !== 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c' 
      ? this.baseUrl 
      : this.sandboxUrl;
  }

  // Helper method to add API key to requests
  private async fetchWithKey(url: string): Promise<Response> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'X-CMC_PRO_API_KEY': this.apiKey || 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c' // Default sandbox key
    };
    
    return fetch(url, { headers });
  }

  // Get formatted data for the crypto trading page
  async getFormattedCryptoData(limit: number = 10): Promise<{
    topCoins: any[],
    globalMetrics: any,
    trending: any
  }> {
    try {
      // Only use free tier endpoints
      const [listings, globalData] = await Promise.all([
        this.getLatestListings(limit),
        this.getGlobalMetrics()
      ]);

      // Use top gainers from listings as trending data
      const trending = listings.data ? 
        listings.data
          .filter((coin: any) => coin.quote.USD.percent_change_24h > 0)
          .sort((a: any, b: any) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h)
          .slice(0, 5) : [];

      return {
        topCoins: listings.data || [],
        globalMetrics: globalData.data || {},
        trending: trending
      };
    } catch (error) {
      console.error('Error fetching CoinMarketCap data:', error);
      throw error;
    }
  }
}

export const coinMarketCapService = new CoinMarketCapService();