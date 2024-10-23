type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const logger = {
  error: (message: string, ...args: unknown[]) => console.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
  info: (message: string, ...args: unknown[]) => console.info(message, ...args),
  debug: (message: string, ...args: unknown[]) => console.debug(message, ...args),
  log: (level: LogLevel, message: string, ...args: unknown[]) => {
    switch (level) {
      case 'error':
        console.error(message, ...args);
        break;
      case 'warn':
        console.warn(message, ...args);
        break;
      case 'info':
        console.info(message, ...args);
        break;
      case 'debug':
        console.debug(message, ...args);
        break;
    }
  },
};

export default logger;
