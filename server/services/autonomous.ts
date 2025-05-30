import { twitterService } from './twitter';
import { aiService } from './ai';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';

const logger = createLogger('Autonomous');

export interface AutonomousConfig {
  enabled: boolean;
  checkIntervalMinutes: number;
  maxRepliesPerHour: number;
  autoReplyToMentions: boolean;
  autoEngageWithTimeline: boolean;
  engagementThreshold: number; // Minimum likes/retweets to engage
  keywords: string[]; // Keywords to look for in timeline
}

export interface AutonomousActivity {
  id: string;
  type: 'timeline_read' | 'mention_reply' | 'auto_post' | 'engagement';
  timestamp: Date;
  content: string;
  success: boolean;
  error?: string;
}

class AutonomousService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private replyCount: number = 0;
  private lastResetTime: Date = new Date();
  private activities: AutonomousActivity[] = [];

  constructor() {
    // Reset reply count every hour
    setInterval(() => {
      this.replyCount = 0;
      this.lastResetTime = new Date();
      logger.info('Reply count reset for new hour');
    }, 60 * 60 * 1000);
  }

  // Start autonomous mode
  async start(userId: number, config: AutonomousConfig): Promise<void> {
    if (this.isRunning) {
      logger.warn('Autonomous mode already running');
      return;
    }

    if (!config.enabled) {
      logger.info('Autonomous mode is disabled in config');
      return;
    }

    logger.info('Starting autonomous mode', { userId, config });
    this.isRunning = true;

    // Run immediately
    await this.runAutonomousCycle(userId, config);

    // Set up interval
    this.intervalId = setInterval(async () => {
      try {
        await this.runAutonomousCycle(userId, config);
      } catch (error) {
        logger.error('Error in autonomous cycle:', error);
      }
    }, config.checkIntervalMinutes * 60 * 1000);
  }

  // Stop autonomous mode
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping autonomous mode');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Get recent activities
  getRecentActivities(limit: number = 10): AutonomousActivity[] {
    return this.activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Main autonomous cycle
  private async runAutonomousCycle(userId: number, config: AutonomousConfig): Promise<void> {
    try {
      logger.info('Running autonomous cycle', { userId });

      // Get user's Twitter credentials
      const user = await storage.getUser(userId);
      if (!user || !user.twitterAccessToken || !user.twitterAccessTokenSecret) {
        logger.warn('User Twitter credentials not found', { userId });
        return;
      }

      // Check mentions and reply if enabled
      if (config.autoReplyToMentions) {
        await this.handleMentions(user.twitterAccessToken, user.twitterAccessTokenSecret, config);
      }

      // Engage with timeline if enabled
      if (config.autoEngageWithTimeline) {
        await this.handleTimelineEngagement(user.twitterAccessToken, user.twitterAccessTokenSecret, config);
      }

      // Generate and post autonomous content occasionally
      if (Math.random() < 0.3) { // 30% chance per cycle
        await this.generateAutonomousContent(user.twitterAccessToken, user.twitterAccessTokenSecret, userId);
      }

    } catch (error) {
      logger.error('Error in autonomous cycle:', error);
      this.addActivity({
        id: this.generateId(),
        type: 'auto_post',
        timestamp: new Date(),
        content: 'Autonomous cycle failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Handle mentions and auto-reply
  private async handleMentions(
    accessToken: string,
    accessTokenSecret: string,
    config: AutonomousConfig
  ): Promise<void> {
    try {
      if (this.replyCount >= config.maxRepliesPerHour) {
        logger.info('Reply limit reached for this hour');
        return;
      }

      const mentions = await twitterService.getMentions(accessToken, accessTokenSecret, 5);
      logger.info(`Found ${mentions.length} mentions`);

      for (const mention of mentions) {
        if (this.replyCount >= config.maxRepliesPerHour) {
          break;
        }

        try {
          // Generate AI response to the mention
          const aiResponse = await aiService.generateTextContent(
            `Responding to: "${mention.text}"`,
            'reply',
            'confident,helpful,crypto-focused',
            280
          );

          // Reply to the mention
          await twitterService.replyToTweet(
            accessToken,
            accessTokenSecret,
            aiResponse,
            mention.id
          );

          this.replyCount++;
          
          this.addActivity({
            id: this.generateId(),
            type: 'mention_reply',
            timestamp: new Date(),
            content: `Replied to @${mention.author_id}: "${aiResponse.substring(0, 50)}..."`,
            success: true
          });

          logger.info('Successfully replied to mention', { mentionId: mention.id });

          // Wait between replies to avoid rate limiting
          await this.sleep(2000);

        } catch (error) {
          logger.error('Error replying to mention:', error);
          this.addActivity({
            id: this.generateId(),
            type: 'mention_reply',
            timestamp: new Date(),
            content: `Failed to reply to mention: ${mention.id}`,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      logger.error('Error handling mentions:', error);
    }
  }

  // Handle timeline engagement
  private async handleTimelineEngagement(
    accessToken: string,
    accessTokenSecret: string,
    config: AutonomousConfig
  ): Promise<void> {
    try {
      const timeline = await twitterService.getHomeTimeline(accessToken, accessTokenSecret, 10);
      logger.info(`Analyzing ${timeline.length} timeline tweets`);

      for (const tweet of timeline) {
        try {
          // Check if tweet meets engagement criteria
          const shouldEngage = this.shouldEngageWithTweet(tweet, config);
          
          if (shouldEngage && this.replyCount < config.maxRepliesPerHour) {
            // Generate contextual response
            const aiResponse = await aiService.generateTextContent(
              `Engaging with tweet: "${tweet.text}"`,
              'reply',
              'supportive,insightful,crypto-trader',
              280
            );

            // Reply to the tweet
            await twitterService.replyToTweet(
              accessToken,
              accessTokenSecret,
              aiResponse,
              tweet.id
            );

            this.replyCount++;
            
            this.addActivity({
              id: this.generateId(),
              type: 'engagement',
              timestamp: new Date(),
              content: `Engaged with timeline tweet: "${aiResponse.substring(0, 50)}..."`,
              success: true
            });

            logger.info('Successfully engaged with timeline tweet', { tweetId: tweet.id });

            // Wait between engagements
            await this.sleep(3000);
          }
        } catch (error) {
          logger.error('Error engaging with tweet:', error);
        }
      }

      this.addActivity({
        id: this.generateId(),
        type: 'timeline_read',
        timestamp: new Date(),
        content: `Analyzed ${timeline.length} timeline tweets`,
        success: true
      });

    } catch (error) {
      logger.error('Error handling timeline engagement:', error);
    }
  }

  // Generate and post autonomous content
  private async generateAutonomousContent(
    accessToken: string,
    accessTokenSecret: string,
    userId: number
  ): Promise<void> {
    try {
      const topics = [
        'Bitcoin market analysis',
        'Crypto trading insights',
        'DeFi opportunities',
        'Market sentiment analysis',
        'Technical analysis update',
        'Blockchain technology trends'
      ];

      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      const aiContent = await aiService.generateTextContent(
        randomTopic,
        'tweet',
        'confident,analytical,crypto-expert',
        280
      );

      // Post the autonomous content
      await twitterService.postTweet(accessToken, accessTokenSecret, aiContent);

      // Save to database
      await storage.createPost({
        userId,
        content: aiContent,
        published: true,
        aiGenerated: true,
        createdAt: new Date()
      });

      this.addActivity({
        id: this.generateId(),
        type: 'auto_post',
        timestamp: new Date(),
        content: `Posted autonomous content: "${aiContent.substring(0, 50)}..."`,
        success: true
      });

      logger.info('Successfully posted autonomous content');

    } catch (error) {
      logger.error('Error generating autonomous content:', error);
      this.addActivity({
        id: this.generateId(),
        type: 'auto_post',
        timestamp: new Date(),
        content: 'Failed to generate autonomous content',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Determine if we should engage with a tweet
  private shouldEngageWithTweet(tweet: any, config: AutonomousConfig): boolean {
    // Check engagement metrics
    const metrics = tweet.public_metrics;
    if (metrics) {
      const totalEngagement = (metrics.like_count || 0) + (metrics.retweet_count || 0);
      if (totalEngagement < config.engagementThreshold) {
        return false;
      }
    }

    // Check for relevant keywords
    const tweetText = tweet.text.toLowerCase();
    const hasRelevantKeywords = config.keywords.some(keyword => 
      tweetText.includes(keyword.toLowerCase())
    );

    // Check for crypto-related context annotations
    const hasCryptoContext = tweet.context_annotations?.some((annotation: any) => 
      annotation.domain?.name?.toLowerCase().includes('crypto') ||
      annotation.domain?.name?.toLowerCase().includes('finance') ||
      annotation.entity?.name?.toLowerCase().includes('bitcoin') ||
      annotation.entity?.name?.toLowerCase().includes('ethereum')
    );

    return hasRelevantKeywords || hasCryptoContext;
  }

  // Add activity to history
  private addActivity(activity: AutonomousActivity): void {
    this.activities.push(activity);
    
    // Keep only last 100 activities
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(-100);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get status
  getStatus(): {
    isRunning: boolean;
    replyCount: number;
    maxRepliesPerHour: number;
    lastResetTime: Date;
    recentActivities: AutonomousActivity[];
  } {
    return {
      isRunning: this.isRunning,
      replyCount: this.replyCount,
      maxRepliesPerHour: 10, // Default value
      lastResetTime: this.lastResetTime,
      recentActivities: this.getRecentActivities(5)
    };
  }
}

export const autonomousService = new AutonomousService();