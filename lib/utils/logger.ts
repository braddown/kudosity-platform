/**
 * Centralized logging system for Kudosity application
 * Provides different log levels and environment-specific behavior
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  component?: string
  action?: string
  userId?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      this.log('info', message, context)
    }
  }

  /**
   * Log warnings (always logged)
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error
    }
    this.log('error', message, errorContext)
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    }

    // In development, use console with colors
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      }
      const resetColor = '\x1b[0m'
      
      console[level === 'debug' ? 'log' : level](
        `${colors[level]}[${level.toUpperCase()}]${resetColor} ${message}`,
        context ? context : ''
      )
      return
    }

    // In production, use structured logging (could integrate with external service)
    if (level === 'error' || level === 'warn') {
      console[level](JSON.stringify(logEntry))
    }
  }

  /**
   * Performance timing utility
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }

  /**
   * Create a scoped logger for a specific component
   */
  createScope(component: string): ScopedLogger {
    return new ScopedLogger(this, component)
  }
}

/**
 * Scoped logger for specific components
 */
class ScopedLogger {
  constructor(
    private logger: Logger,
    private component: string
  ) {}

  debug(message: string, context?: Omit<LogContext, 'component'>): void {
    this.logger.debug(message, { component: this.component, ...context })
  }

  info(message: string, context?: Omit<LogContext, 'component'>): void {
    this.logger.info(message, { component: this.component, ...context })
  }

  warn(message: string, context?: Omit<LogContext, 'component'>): void {
    this.logger.warn(message, { component: this.component, ...context })
  }

  error(message: string, error?: Error | unknown, context?: Omit<LogContext, 'component'>): void {
    this.logger.error(message, error, { component: this.component, ...context })
  }

  time(label: string): void {
    this.logger.time(`${this.component}:${label}`)
  }

  timeEnd(label: string): void {
    this.logger.timeEnd(`${this.component}:${label}`)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience function for creating scoped loggers
export const createLogger = (component: string): ScopedLogger => 
  logger.createScope(component)