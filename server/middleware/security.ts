import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// User role definitions
export enum UserRole {
  ADMIN = 'admin',
  PREMIUM = 'premium', 
  FREE = 'free',
  GUEST = 'guest'
}

// Role-based rate limits
export const ROLE_LIMITS = {
  [UserRole.ADMIN]: {
    general: Infinity,
    api: Infinity,
    auth: Infinity,
    ai: Infinity
  },
  [UserRole.PREMIUM]: {
    general: 1000,
    api: 500,
    auth: 20,
    ai: 100
  },
  [UserRole.FREE]: {
    general: 200,
    api: 100,
    auth: 10,
    ai: 20
  },
  [UserRole.GUEST]: {
    general: 50,
    api: 25,
    auth: 5,
    ai: 5
  }
};

// Function to determine user role from request
export const getUserRole = (req: Request): UserRole => {
  // Check for admin key in headers or query
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  if (adminKey === process.env.ADMIN_KEY) {
    return UserRole.ADMIN;
  }
  
  // Check for premium token
  const premiumToken = req.headers['x-premium-token'] || req.query.premiumToken;
  if (premiumToken) {
    return UserRole.PREMIUM;
  }
  
  // Check for general auth token
  const authToken = req.headers.authorization || req.query.token;
  if (authToken) {
    return UserRole.FREE;
  }
  
  return UserRole.GUEST;
};

// Rate limiting configuration with role-based limits
export const createRoleLimiter = (limitType: 'general' | 'api' | 'auth' | 'ai', windowMs: number, message?: string) => {
  return rateLimit({
    windowMs,
    max: (req: Request) => {
      const userRole = getUserRole(req);
      const limit = ROLE_LIMITS[userRole][limitType];
      return limit === Infinity ? 0 : limit; // 0 means no limit in express-rate-limit
    },
    message: message || 'Rate limit exceeded for your subscription level.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userRole = getUserRole(req);
      // Different keys for different roles to separate their limits
      return `${req.ip}-${userRole}`;
    },
    handler: (req: Request, res: Response) => {
      const userRole = getUserRole(req);
      const limit = ROLE_LIMITS[userRole][limitType];
      
      let upgradeMessage = '';
      if (userRole === UserRole.GUEST) {
        upgradeMessage = ' Register for a free account to get higher limits!';
      } else if (userRole === UserRole.FREE) {
        upgradeMessage = ' Upgrade to Premium for unlimited access!';
      }
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You've reached your ${limitType} limit (${limit} requests per ${Math.round(windowMs / 60000)} minutes) for ${userRole} users.${upgradeMessage}`,
        retryAfter: Math.round(windowMs / 1000),
        currentPlan: userRole,
        upgradeAvailable: userRole !== UserRole.ADMIN && userRole !== UserRole.PREMIUM
      });
    },
    skip: (req: Request) => {
      const userRole = getUserRole(req);
      return userRole === UserRole.ADMIN; // Admins bypass all limits
    }
  });
};

// Legacy function for backward compatibility
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General rate limiter - 100 requests per 15 minutes
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP, please try again in 15 minutes.'
);

// API rate limiter - 50 requests per 15 minutes
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50,
  'Too many API requests from this IP, please try again in 15 minutes.'
);

// Auth rate limiter - 5 attempts per 15 minutes
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many authentication attempts from this IP, please try again in 15 minutes.'
);

// AI generation rate limiter - 10 requests per hour
export const aiLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many AI generation requests from this IP, please try again in 1 hour.'
);

// Helmet security configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", 'wss:', 'ws:', 'https:', 'http:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common XSS patterns
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: isDevelopment ? err.message : 'Invalid input data'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'File size exceeds the allowed limit'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong'
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(logData));
  });
  
  next();
};