import type { LogHandler } from "lib/2.app/handlers/log.contract";
import { type LogType, LogLevel, type LoggingConfig } from "../../2.app/handlers/log.contract";

const createLogHandler = ({logger, logLevel}: LoggingConfig): LogHandler => {
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