import { type LogType, LogLevel, type LoggingConfig } from "./logging.contract";
import type { ForLogging } from "lib/2.app/driving-ports/for-logging.port";

const createLogger = ({logger, logLevel}: LoggingConfig): ForLogging => {
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
  }, {} as ForLogging);
};

export { createLogger };