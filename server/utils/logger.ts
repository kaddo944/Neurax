import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Enhanced logging functions with context
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(message: string, meta?: any): string {
    const contextMsg = `[${this.context}] ${message}`;
    return meta ? `${contextMsg} ${JSON.stringify(meta)}` : contextMsg;
  }

  error(message: string, error?: Error | any, meta?: any) {
    if (error instanceof Error) {
      logger.error(this.formatMessage(message, meta), { error: error.stack });
    } else {
      logger.error(this.formatMessage(message, { ...meta, error }));
    }
  }

  warn(message: string, meta?: any) {
    logger.warn(this.formatMessage(message, meta));
  }

  info(message: string, meta?: any) {
    logger.info(this.formatMessage(message, meta));
  }

  http(message: string, meta?: any) {
    logger.http(this.formatMessage(message, meta));
  }

  debug(message: string, meta?: any) {
    logger.debug(this.formatMessage(message, meta));
  }

  // Performance logging
  time(label: string) {
    console.time(`[${this.context}] ${label}`);
  }

  timeEnd(label: string) {
    console.timeEnd(`[${this.context}] ${label}`);
  }

  // API request/response logging
  logApiRequest(req: any, additionalInfo?: any) {
    this.info('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      ...additionalInfo
    });
  }

  logApiResponse(req: any, res: any, duration: number, additionalInfo?: any) {
    this.info('API Response', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ...additionalInfo
    });
  }

  // Database operation logging
  logDbOperation(operation: string, table: string, duration?: number, meta?: any) {
    this.debug('Database Operation', {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      ...meta
    });
  }

  // External API logging
  logExternalApi(service: string, endpoint: string, status: number, duration: number, meta?: any) {
    this.info('External API Call', {
      service,
      endpoint,
      status,
      duration: `${duration}ms`,
      ...meta
    });
  }

  // Security event logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', meta?: any) {
    const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    logger[logLevel](this.formatMessage(`Security Event: ${event}`, { severity, ...meta }));
  }
}

// Export default logger instance
export default logger;

// Export logger factory
export const createLogger = (context: string) => new Logger(context);