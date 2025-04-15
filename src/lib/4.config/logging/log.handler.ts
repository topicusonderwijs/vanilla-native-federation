import type { LogHandler } from "lib/2.app/config/log.contract";
import { type LogType, LogLevel } from "../../2.app/config/log.contract";

const createLogHandler = (logger: LogHandler, logLevel: LogType): LogHandler => {
    const logTypes = Object.keys(LogLevel)
        .filter(key => isNaN(Number(key))) as LogType[];

    return logTypes.reduce((acc, logMessageType) => {
        return {
            ...acc,
            [logMessageType]: (message: string) => {
                if (LogLevel[logMessageType] >= LogLevel[logLevel]) {
                    logger[logMessageType](message);
                }
            }
        };
    }, {} as LogHandler);
};

export { createLogHandler };