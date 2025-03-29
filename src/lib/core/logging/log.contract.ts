
const LogLevel = {
    debug: 0,
    warn: 1,
    error: 2
}

type LogType = keyof typeof LogLevel;

type LogHandler = Record<LogType, (msg: string) => void>;

export {LogLevel, LogType, LogHandler}