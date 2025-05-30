// WebSocket message base type
export interface WebSocketMessage {
  type: string;
  timestamp: number;
  [key: string]: any;
}

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  twitterConnected: boolean;
  twitterUsername?: string;
  twitterId?: string;
}

// Post type definition based on the posts table schema
export interface Post {
  id: number;
  userId: number;
  twitterAccountId?: number;
  content: string;
  imageUrl?: string;
  twitterId?: string;
  scheduledFor?: string;
  published: boolean;
  aiGenerated: boolean;
  engagement?: any;
  createdAt: string;
}

// Trading call type definition
export interface TradingCall {
  id: number;
  userId: number;
  asset: string;
  position: string;
  entryPrice: string;
  targetPrice?: string;
  stopLoss?: string;
  status: string;
  notes?: string;
  createdAt: string;
  currentPrice?: string;
  profitLoss?: number | string;
  profitLossPercentage?: number;
  closedAt?: string;
  closedPrice?: string;
  startDate?: string;
  endDate?: string;
}

// Types for other application-specific interfaces can be added here