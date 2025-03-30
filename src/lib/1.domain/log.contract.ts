export const LogLevel = {
    debug: 0,
    warn: 1,
    error: 2
}

export type LogType = keyof typeof LogLevel;