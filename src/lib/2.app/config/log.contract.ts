export const LogLevel = {
    debug: 0,
    warn: 1,
    error: 2
}

export type LogType = keyof typeof LogLevel;

export type LogHandler = {
    error: (msg: string, details?: string|Error) => void;
    warn: (msg: string, details?: string|Error) => void;
    debug: (msg: string, details?: string|Error) => void;
}

export type LoggingConfig = {
    log: LogHandler,
}

export type LoggingOptions = {
    logger?: LogHandler,
    logLevel?: LogType,
}