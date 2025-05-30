import { createLogger } from './logger';

const logger = createLogger('Cache');

// In-memory cache implementation (fallback when Redis is not available)
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Redis cache implementation
class RedisCache {
  private client: any;
  private isConnected = false;

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    try {
      // Dynamic import to handle optional Redis dependency
      const redis = await import('redis').catch(() => null);
      if (!redis) {
        console.warn('Redis not available, using memory cache fallback');
        return;
      }
      
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis connection retry limit exceeded');
              return false;
            }
            return Math.min(retries * 50, 500);
          }
        }
      });
      
      this.client.on('error', (err: Error) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });
      
      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected');
        this.isConnected = false;
      });
      
      await this.client.connect().catch((err: Error) => {
        logger.error('Failed to connect to Redis:', err);
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('Redis not available, falling back to memory cache', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis set error', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.client.flushAll();
    } catch (error) {
      logger.error('Redis flush error', error);
    }
  }
}

// Cache manager that handles both Redis and memory cache
class CacheManager {
  private redisCache: RedisCache;
  private memoryCache: MemoryCache;
  private useRedis: boolean;

  constructor() {
    this.memoryCache = new MemoryCache();
    this.redisCache = new RedisCache();
    this.useRedis = process.env.REDIS_URL !== undefined;
  }

  private getCache() {
    return this.useRedis ? this.redisCache : this.memoryCache;
  }

  async get(key: string): Promise<any> {
    const startTime = Date.now();
    try {
      const value = await this.getCache().get(key);
      const duration = Date.now() - startTime;
      
      if (value !== null) {
        logger.debug('Cache hit', { key, duration });
      } else {
        logger.debug('Cache miss', { key, duration });
      }
      
      return value;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const startTime = Date.now();
    try {
      await this.getCache().set(key, value, ttlSeconds);
      const duration = Date.now() - startTime;
      logger.debug('Cache set', { key, ttl: ttlSeconds, duration });
    } catch (error) {
      logger.error('Cache set error', error, { key });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.getCache().del(key);
      logger.debug('Cache delete', { key });
    } catch (error) {
      logger.error('Cache delete error', error, { key });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await this.getCache().exists(key);
    } catch (error) {
      logger.error('Cache exists error', error, { key });
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.getCache().flush();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error', error);
    }
  }

  // Helper method for caching function results
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  // Generate cache keys
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Export cache key generators
export const CacheKeys = {
  userProfile: (userId: string) => cache.generateKey('user', 'profile', userId),
  twitterAccount: (accountId: string) => cache.generateKey('twitter', 'account', accountId),
  cryptoPrice: (symbol: string, currency: string = 'usd') => 
    cache.generateKey('crypto', 'price', symbol, currency),
  cryptoTopCoins: (limit: number = 10) => cache.generateKey('crypto', 'top', limit),
  aiGeneration: (prompt: string, type: string) => 
    cache.generateKey('ai', 'generation', Buffer.from(prompt).toString('base64'), type),
  tradingCalls: (userId: string) => cache.generateKey('trading', 'calls', userId),
  metrics: (userId: string, period: string) => cache.generateKey('metrics', userId, period)
};

export default cache;