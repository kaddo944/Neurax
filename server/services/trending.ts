import { twitterService } from './twitter';
import { aiService } from './ai';
import { coinMarketCapService } from './coinmarketcap';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';
import type { ContentIdea, InsertContentIdea } from '../../shared/schema';

const logger = createLogger('TrendingAnalysis');

export interface TrendingTopic {
  keyword: string;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'crypto' | 'trading' | 'defi' | 'nft' | 'general';
  relevanceScore: number;
}

export interface AnalysisResult {
  trendingTopics: TrendingTopic[];
  contentIdeas: ContentIdea[];
  scheduledPosts: number;
  analysisTimestamp: Date;
}

class TrendingAnalysisService {
  private readonly CRYPTO_KEYWORDS = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
    'defi', 'nft', 'blockchain', 'trading', 'altcoin', 'hodl',
    'web3', 'dao', 'yield', 'staking', 'mining', 'wallet'
  ];

  // Analyze trending posts and topics
  async analyzeTrendingPosts(
    accessToken: string,
    accessTokenSecret: string,
    userId: number
  ): Promise<AnalysisResult> {
    try {
      logger.info('Starting trending analysis', { userId });

      // 1. Get trending crypto data from CoinMarketCap
      const cryptoTrends = await this.getCryptoTrends();
      
      // 2. Analyze Twitter timeline for trending topics
      const twitterTrends = await this.analyzeTwitterTrends(accessToken, accessTokenSecret);
      
      // 3. Combine and score trending topics
      const trendingTopics = this.combineTrends(cryptoTrends, twitterTrends);
      
      // 4. Generate content ideas based on trends
      const contentIdeas = await this.generateContentIdeas(trendingTopics, userId);
      
      // 5. Schedule optimal posts
      const scheduledPosts = await this.scheduleOptimalPosts(contentIdeas, userId);

      const result: AnalysisResult = {
        trendingTopics,
        contentIdeas,
        scheduledPosts,
        analysisTimestamp: new Date()
      };

      logger.info('Trending analysis completed', {
        topicsFound: trendingTopics.length,
        ideasGenerated: contentIdeas.length,
        postsScheduled: scheduledPosts
      });

      return result;
    } catch (error) {
      logger.error('Error in trending analysis:', error);
      throw error;
    }
  }

  // Get trending cryptocurrencies
  private async getCryptoTrends(): Promise<TrendingTopic[]> {
    try {
      const trendingCrypto = await coinMarketCapService.getTrendingCryptocurrencies(20);
      
      return trendingCrypto.map((crypto: any, index: number) => ({
        keyword: crypto.name.toLowerCase(),
        volume: crypto.quote?.USD?.volume_24h || 0,
        sentiment: crypto.quote?.USD?.percent_change_24h > 0 ? 'positive' : 'negative',
        category: 'crypto' as const,
        relevanceScore: Math.max(0, 100 - index * 5) // Higher score for top positions
      }));
    } catch (error) {
      logger.warn('Failed to get crypto trends, using fallback', error);
      return this.getFallbackCryptoTrends();
    }
  }

  // Analyze Twitter timeline for trends
  private async analyzeTwitterTrends(
    accessToken: string,
    accessTokenSecret: string
  ): Promise<TrendingTopic[]> {
    try {
      const timeline = await twitterService.getHomeTimeline(accessToken, accessTokenSecret, 50);
      const keywordCounts = new Map<string, number>();
      const sentimentMap = new Map<string, number[]>();

      // Analyze tweets for keywords and sentiment
      for (const tweet of timeline) {
        const text = tweet.text.toLowerCase();
        const engagement = (tweet.public_metrics?.like_count || 0) + 
                          (tweet.public_metrics?.retweet_count || 0);

        // Count crypto-related keywords
        for (const keyword of this.CRYPTO_KEYWORDS) {
          if (text.includes(keyword)) {
            keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
            
            if (!sentimentMap.has(keyword)) {
              sentimentMap.set(keyword, []);
            }
            sentimentMap.get(keyword)!.push(engagement);
          }
        }
      }

      // Convert to trending topics
      return Array.from(keywordCounts.entries())
        .filter(([_, count]) => count >= 2) // Minimum 2 mentions
        .map(([keyword, count]) => {
          const engagements = sentimentMap.get(keyword) || [];
          const avgEngagement = engagements.reduce((a, b) => a + b, 0) / engagements.length;
          
          return {
            keyword,
            volume: count,
            sentiment: avgEngagement > 10 ? 'positive' : 'neutral',
            category: this.categorizeKeyword(keyword),
            relevanceScore: Math.min(100, count * 10 + avgEngagement)
          } as TrendingTopic;
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 15);
    } catch (error) {
      logger.warn('Failed to analyze Twitter trends', error);
      return [];
    }
  }

  // Combine crypto and Twitter trends
  private combineTrends(
    cryptoTrends: TrendingTopic[],
    twitterTrends: TrendingTopic[]
  ): TrendingTopic[] {
    const combined = new Map<string, TrendingTopic>();

    // Add crypto trends
    for (const trend of cryptoTrends) {
      combined.set(trend.keyword, trend);
    }

    // Merge Twitter trends
    for (const trend of twitterTrends) {
      const existing = combined.get(trend.keyword);
      if (existing) {
        // Boost relevance score for topics trending on both platforms
        existing.relevanceScore += trend.relevanceScore * 0.5;
        existing.volume += trend.volume;
      } else {
        combined.set(trend.keyword, trend);
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }

  // Generate content ideas from trending topics
  private async generateContentIdeas(
    trendingTopics: TrendingTopic[],
    userId: number
  ): Promise<ContentIdea[]> {
    const ideas: ContentIdea[] = [];
    const contentTypes = ['tweet', 'thread', 'analysis', 'meme'];

    // Generate 2-3 ideas per top trending topic
    for (const topic of trendingTopics.slice(0, 8)) {
      const numIdeas = topic.relevanceScore > 80 ? 3 : 2;
      
      for (let i = 0; i < numIdeas; i++) {
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        
        try {
          const prompt = this.createContentPrompt(topic, contentType);
          const content = await aiService.generateTextContent(
            prompt,
            contentType,
            'confident,analytical,crypto-expert',
            contentType === 'thread' ? 1000 : 280
          );

          const idea = await storage.saveContentIdea({
            userId,
            content,
            type: contentType
          });

          ideas.push(idea);
        } catch (error) {
          logger.warn(`Failed to generate content for ${topic.keyword}:`, error);
        }
      }
    }

    return ideas;
  }

  // Schedule posts at optimal times
  private async scheduleOptimalPosts(
    contentIdeas: ContentIdea[],
    userId: number
  ): Promise<number> {
    const optimalTimes = this.getOptimalPostingTimes();
    let scheduledCount = 0;

    // Schedule top 3-5 content ideas
    const topIdeas = contentIdeas.slice(0, 5);
    
    for (let i = 0; i < topIdeas.length && i < optimalTimes.length; i++) {
      const idea = topIdeas[i];
      const scheduledTime = optimalTimes[i];

      try {
        await storage.createPost({
          userId,
          content: idea.content,
          scheduledFor: scheduledTime,
          aiGenerated: true,
          published: false
        });

        // Mark idea as used
        await storage.markContentIdeaAsUsed(idea.id);
        scheduledCount++;
      } catch (error) {
        logger.warn(`Failed to schedule post for idea ${idea.id}:`, error);
      }
    }

    return scheduledCount;
  }

  // Get optimal posting times (next 24-48 hours)
  private getOptimalPostingTimes(): Date[] {
    const now = new Date();
    const times: Date[] = [];
    
    // Optimal times: 9 AM, 1 PM, 6 PM, 9 PM (user's timezone)
    const optimalHours = [9, 13, 18, 21];
    
    for (let day = 0; day < 2; day++) {
      for (const hour of optimalHours) {
        const time = new Date(now);
        time.setDate(now.getDate() + day);
        time.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        
        if (time > now) {
          times.push(time);
        }
      }
    }
    
    return times.sort((a, b) => a.getTime() - b.getTime());
  }

  // Create content generation prompt
  private createContentPrompt(topic: TrendingTopic, contentType: string): string {
    const sentimentText = topic.sentiment === 'positive' ? 'bullish' : 
                         topic.sentiment === 'negative' ? 'bearish' : 'neutral';
    
    switch (contentType) {
      case 'analysis':
        return `Write a technical analysis about ${topic.keyword} with a ${sentimentText} outlook. Include market insights and trading perspective.`;
      case 'thread':
        return `Create a Twitter thread explaining why ${topic.keyword} is trending and what it means for crypto traders.`;
      case 'meme':
        return `Create a humorous crypto meme post about ${topic.keyword} that crypto traders will relate to.`;
      default:
        return `Write an engaging tweet about ${topic.keyword} with a ${sentimentText} crypto trading perspective.`;
    }
  }

  // Categorize keywords
  private categorizeKeyword(keyword: string): TrendingTopic['category'] {
    if (['bitcoin', 'btc', 'ethereum', 'eth', 'altcoin'].includes(keyword)) {
      return 'crypto';
    }
    if (['defi', 'yield', 'staking', 'dao'].includes(keyword)) {
      return 'defi';
    }
    if (['nft', 'opensea', 'mint'].includes(keyword)) {
      return 'nft';
    }
    if (['trading', 'hodl', 'pump', 'dump'].includes(keyword)) {
      return 'trading';
    }
    return 'general';
  }

  // Fallback crypto trends when API fails
  private getFallbackCryptoTrends(): TrendingTopic[] {
    return [
      { keyword: 'bitcoin', volume: 1000000, sentiment: 'positive', category: 'crypto', relevanceScore: 95 },
      { keyword: 'ethereum', volume: 800000, sentiment: 'positive', category: 'crypto', relevanceScore: 90 },
      { keyword: 'defi', volume: 500000, sentiment: 'neutral', category: 'defi', relevanceScore: 85 },
      { keyword: 'trading', volume: 300000, sentiment: 'positive', category: 'trading', relevanceScore: 80 }
    ];
  }
}

export const trendingAnalysisService = new TrendingAnalysisService();