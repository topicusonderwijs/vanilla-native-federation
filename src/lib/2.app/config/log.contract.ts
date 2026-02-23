export const LogLevel = {
  debug: 0,
  warn: 1,
  error: 2,
};

export type LogType = keyof typeof LogLevel;

export type Logger = {
  error: (step: number, msg: string, details?: unknown) => void;
  warn: (step: number, msg: string, details?: unknown) => void;
  debug: (step: number, msg: string, details?: unknown) => void;
};

export type LogHandler = Logger & {
  level: LogType;
};

export type LoggingConfig = {
  log: LogHandler;
  sse: boolean;
};

export type LoggingOptions = {
  logger?: Logger;
  logLevel?: LogType;
  sse?: boolean;
};
