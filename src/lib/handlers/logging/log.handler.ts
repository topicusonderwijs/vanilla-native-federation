import { type LogHandler, type LogType, LogLevel } from "./log.contract";
import type { LoggingConfig } from "../../utils/config/config.contract";

const logHandlerFactory = ({logger, logLevel}: LoggingConfig): LogHandler => {
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

export { logHandlerFactory };