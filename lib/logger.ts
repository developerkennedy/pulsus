type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function formatMessage(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({ timestamp, level, message, ...context });
  }

  const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatMessage('info', message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, context?: LogContext) {
    console.error(formatMessage('error', message, context));
  },
};
