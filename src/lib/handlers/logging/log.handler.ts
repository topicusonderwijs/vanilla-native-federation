import { type LogHandler, type LogType, LogLevel } from "./log.contract";

const logHandlerFactory = (minLevel: LogType, logger: LogHandler): LogHandler => {
  const logTypes = Object.keys(LogLevel)
    .filter(key => isNaN(Number(key))) as LogType[];
  
  return logTypes.reduce((acc, logType) => {    
    return {
      ...acc,
      [logType]: (message: string) => {
        if (LogLevel[logType] >= LogLevel[minLevel]) {
          logger[logType](message);
        }
      }
    };
  }, {} as LogHandler);
};

  export { logHandlerFactory };