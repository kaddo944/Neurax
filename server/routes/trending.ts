import { Router, Request, Response, NextFunction } from 'express';
import { trendingAnalysisService } from '../services/trending';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    // Add user info to request for TypeScript
    (req as any).user = { id: req.session.userId };
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const router = Router();
const logger = createLogger('TrendingRoutes');

// Get trending analysis
router.get('/analysis', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await storage.getUserById(userId);
    
    if (!user?.twitterAccessToken || !user?.twitterAccessTokenSecret) {
      return res.status(400).json({ 
        error: 'Twitter credentials not found. Please connect your Twitter account.' 
      });
    }

    logger.info('Starting trending analysis request', { userId });
    
    const analysisResult = await trendingAnalysisService.analyzeTrendingPosts(
      user.twitterAccessToken,
      user.twitterAccessTokenSecret,
      userId
    );

    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    logger.error('Error in trending analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze trending posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get content ideas
router.get('/content-ideas', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeUsed = req.query.includeUsed === 'true';
    
    let ideas;
    if (includeUsed) {
      ideas = await storage.getAllContentIdeas(userId, limit);
    } else {
      ideas = await storage.getUnusedContentIdeas(userId, limit);
    }

    res.json({
      success: true,
      data: ideas
    });
  } catch (error) {
    logger.error('Error fetching content ideas:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content ideas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate content ideas manually
router.post('/generate-ideas', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { topics, count = 5 } = req.body;
    
    const user = await storage.getUserById(userId);
    
    if (!user?.twitterAccessToken || !user?.twitterAccessTokenSecret) {
      return res.status(400).json({ 
        error: 'Twitter credentials not found. Please connect your Twitter account.' 
      });
    }

    // If no topics provided, run full analysis
    if (!topics || topics.length === 0) {
      const analysisResult = await trendingAnalysisService.analyzeTrendingPosts(
        user.twitterAccessToken,
        user.twitterAccessTokenSecret,
        userId
      );
      
      return res.json({
        success: true,
        data: {
          ideas: analysisResult.contentIdeas,
          trendingTopics: analysisResult.trendingTopics
        }
      });
    }

    // Generate ideas for specific topics
    const ideas = [];
    for (const topic of topics.slice(0, count)) {
      try {
        const idea = await storage.saveContentIdea({
          userId,
          content: `Generated content idea for: ${topic}`,
          type: 'tweet'
        });
        ideas.push(idea);
      } catch (error) {
        logger.warn(`Failed to generate idea for topic ${topic}:`, error);
      }
    }

    res.json({
      success: true,
      data: { ideas }
    });
  } catch (error) {
    logger.error('Error generating content ideas:', error);
    res.status(500).json({ 
      error: 'Failed to generate content ideas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark content idea as used
router.patch('/content-ideas/:id/use', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const ideaId = parseInt(req.params.id);
    
    await storage.markContentIdeaAsUsed(ideaId);
    
    res.json({
      success: true,
      message: 'Content idea marked as used'
    });
  } catch (error) {
    logger.error('Error marking content idea as used:', error);
    res.status(500).json({ 
      error: 'Failed to mark content idea as used',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete content idea
router.delete('/content-ideas/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const ideaId = parseInt(req.params.id);
    
    await storage.deleteContentIdea(ideaId);
    
    res.json({
      success: true,
      message: 'Content idea deleted'
    });
  } catch (error) {
    logger.error('Error deleting content idea:', error);
    res.status(500).json({ 
      error: 'Failed to delete content idea',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get trending topics summary
router.get('/topics', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await storage.getUserById(userId);
    
    if (!user?.twitterAccessToken || !user?.twitterAccessTokenSecret) {
      return res.status(400).json({ 
        error: 'Twitter credentials not found. Please connect your Twitter account.' 
      });
    }

    // Get just the trending topics without full analysis
    const analysisResult = await trendingAnalysisService.analyzeTrendingPosts(
      user.twitterAccessToken,
      user.twitterAccessTokenSecret,
      userId
    );

    res.json({
      success: true,
      data: {
        topics: analysisResult.trendingTopics,
        timestamp: analysisResult.analysisTimestamp
      }
    });
  } catch (error) {
    logger.error('Error fetching trending topics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trending topics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;