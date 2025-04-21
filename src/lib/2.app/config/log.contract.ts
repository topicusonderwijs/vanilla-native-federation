export const LogLevel = {
    debug: 0,
    warn: 1,
    error: 2
}

export type LogType = keyof typeof LogLevel;

export type Logger = {
    error: (msg: string, details?: unknown) => void;
    warn: (msg: string, details?: unknown) => void;
    debug: (msg: string, details?: unknown) => void;
}

export type LogHandler = Logger & {
    level: LogType
}

export type LoggingConfig = {
    log: LogHandler,
}

export type LoggingOptions = {
    logger?: Logger,
    logLevel?: LogType,
}