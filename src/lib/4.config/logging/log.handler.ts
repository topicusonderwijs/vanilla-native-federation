import { type LogType, type LogHandler, type Logger, LogLevel } from "lib/2.app/config/log.contract";

const createLogHandler = (logger: Logger, logLevel: LogType): LogHandler => {
    const logTypes = Object.keys(LogLevel)
        .filter(key => isNaN(Number(key))) as LogType[];

    return logTypes.reduce((acc, logMessageType) => {
        return {
            ...acc,
            [logMessageType]: (message: string, details: unknown) => {
                if (LogLevel[logMessageType] >= LogLevel[logLevel]) {
                    logger[logMessageType](message, details);
                }
            }
        };
    }, {level: logLevel} as LogHandler);
};

export { createLogHandler };