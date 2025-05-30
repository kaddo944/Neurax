import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CryptoCurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  last_updated: string;
  date_added: string;
  tags: string[];
  platform: any;
  self_reported_circulating_supply: number;
  self_reported_market_cap: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
}

interface GlobalMetrics {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_market_pairs: number;
  active_exchanges: number;
  total_exchanges: number;
  eth_dominance: number;
  btc_dominance: number;
  eth_dominance_yesterday: number;
  btc_dominance_yesterday: number;
  eth_dominance_24h_percentage_change: number;
  btc_dominance_24h_percentage_change: number;
  defi_volume_24h: number;
  defi_volume_24h_reported: number;
  defi_market_cap: number;
  defi_24h_percentage_change: number;
  stablecoin_volume_24h: number;
  stablecoin_volume_24h_reported: number;
  stablecoin_market_cap: number;
  stablecoin_24h_percentage_change: number;
  derivatives_volume_24h: number;
  derivatives_volume_24h_reported: number;
  derivatives_24h_percentage_change: number;
  quote: {
    USD: {
      total_market_cap: number;
      total_volume_24h: number;
      total_volume_24h_reported: number;
      altcoin_volume_24h: number;
      altcoin_volume_24h_reported: number;
      altcoin_market_cap: number;
      total_market_cap_yesterday: number;
      total_volume_24h_yesterday: number;
      total_market_cap_yesterday_percentage_change: number;
      total_volume_24h_yesterday_percentage_change: number;
      last_updated: string;
    };
  };
}

interface TrendingData {
  gainers: CryptoCurrency[];
  losers: CryptoCurrency[];
}

interface DashboardData {
  topCoins: CryptoCurrency[];
  globalMetrics: GlobalMetrics;
  trending: TrendingData;
}

// Fetch CoinMarketCap dashboard data
const fetchDashboardData = async (limit: number = 10): Promise<DashboardData> => {
  const response = await fetch(`/api/coinmarketcap/dashboard?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
};

// Fetch latest cryptocurrency listings
const fetchListings = async (limit: number = 100, convert: string = 'USD') => {
  const response = await fetch(`/api/coinmarketcap/listings?limit=${limit}&convert=${convert}`);
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  return response.json();
};

// Fetch specific cryptocurrency quotes
const fetchQuotes = async (symbols: string[], convert: string = 'USD') => {
  const symbolsParam = symbols.join(',');
  const response = await fetch(`/api/coinmarketcap/quotes?symbols=${symbolsParam}&convert=${convert}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quotes');
  }
  return response.json();
};

// Fetch global metrics
const fetchGlobalMetrics = async (convert: string = 'USD') => {
  const response = await fetch(`/api/coinmarketcap/global?convert=${convert}`);
  if (!response.ok) {
    throw new Error('Failed to fetch global metrics');
  }
  return response.json();
};

// Fetch trending cryptocurrencies
const fetchTrending = async (limit: number = 10, timePeriod: string = '24h') => {
  const response = await fetch(`/api/coinmarketcap/trending?limit=${limit}&time_period=${timePeriod}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trending data');
  }
  return response.json();
};

export const useCoinMarketCap = () => {
  // Dashboard data query
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['coinmarketcap', 'dashboard'],
    queryFn: () => fetchDashboardData(10),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  // Listings query
  const {
    data: listingsData,
    isLoading: isListingsLoading,
    error: listingsError,
    refetch: refetchListings
  } = useQuery({
    queryKey: ['coinmarketcap', 'listings'],
    queryFn: () => fetchListings(50),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Global metrics query
  const {
    data: globalData,
    isLoading: isGlobalLoading,
    error: globalError,
    refetch: refetchGlobal
  } = useQuery({
    queryKey: ['coinmarketcap', 'global'],
    queryFn: () => fetchGlobalMetrics(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Trending query
  const {
    data: trendingData,
    isLoading: isTrendingLoading,
    error: trendingError,
    refetch: refetchTrending
  } = useQuery({
    queryKey: ['coinmarketcap', 'trending'],
    queryFn: () => fetchTrending(10),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Function to get specific quotes
  const getQuotes = async (symbols: string[], convert: string = 'USD') => {
    return fetchQuotes(symbols, convert);
  };

  // Function to refresh all data
  const refreshAllData = () => {
    refetchDashboard();
    refetchListings();
    refetchGlobal();
    refetchTrending();
  };

  // Format currency
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (currency === 'USD') {
      if (value >= 1e12) {
        return `$${(value / 1e12).toFixed(2)}T`;
      } else if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
      } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
      } else if (value >= 1) {
        return `$${value.toFixed(2)}`;
      } else {
        return `$${value.toFixed(6)}`;
      }
    }
    
    return value.toLocaleString();
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get color for percentage change
  const getPercentageColor = (value: number): string => {
    if (value === null || value === undefined) return 'text-matrixGreen/70';
    return value >= 0 ? 'text-neonGreen' : 'text-red-400';
  };

  // Get icon for percentage change
  const getPercentageIcon = (value: number): string => {
    if (value === null || value === undefined) return 'fas fa-minus';
    return value >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  };

  return {
    // Data
    dashboardData,
    listingsData,
    globalData,
    trendingData,
    
    // Loading states
    isDashboardLoading,
    isListingsLoading,
    isGlobalLoading,
    isTrendingLoading,
    isLoading: isDashboardLoading || isListingsLoading || isGlobalLoading || isTrendingLoading,
    
    // Errors
    dashboardError,
    listingsError,
    globalError,
    trendingError,
    hasError: !!(dashboardError || listingsError || globalError || trendingError),
    
    // Functions
    getQuotes,
    refreshAllData,
    refetchDashboard,
    refetchListings,
    refetchGlobal,
    refetchTrending,
    
    // Utility functions
    formatCurrency,
    formatPercentage,
    getPercentageColor,
    getPercentageIcon,
  };
};