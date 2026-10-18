export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  roomId?: string;
  scanId?: string;
  jobId?: string;
  service?: string;
  [key: string]: any;
}

export class StructuredLogger {
  private service: string;
  private defaultContext: LogContext;

  constructor(service: string = 'RoomTrace', defaultContext: LogContext = {}) {
    this.service = service;
    this.defaultContext = defaultContext;
  }

  child(context: LogContext): StructuredLogger {
    return new StructuredLogger(this.service, { ...this.defaultContext, ...context });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      context: { ...this.defaultContext, ...meta },
    };

    // Output structured JSON in production, or formatted string in development
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const color =
        level === 'ERROR' || level === 'FATAL'
          ? '\x1b[31m'
          : level === 'WARN'
          ? '\x1b[33m'
          : level === 'INFO'
          ? '\x1b[36m'
          : '\x1b[90m';
      console.log(
        `${color}[${entry.timestamp}] [${level}] [${this.service}]:\x1b[0m ${message}`,
        Object.keys(entry.context).length > 0 ? entry.context : ''
      );
    }
  }

  debug(msg: string, meta?: Record<string, any>) {
    this.log('DEBUG', msg, meta);
  }

  info(msg: string, meta?: Record<string, any>) {
    this.log('INFO', msg, meta);
  }

  warn(msg: string, meta?: Record<string, any>) {
    this.log('WARN', msg, meta);
  }

  error(msg: string, meta?: Record<string, any>) {
    this.log('ERROR', msg, meta);
  }

  fatal(msg: string, meta?: Record<string, any>) {
    this.log('FATAL', msg, meta);
  }
}

export const logger = new StructuredLogger('RoomTrace');
