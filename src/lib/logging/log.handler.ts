
const LogLevel = {
    debug: 0,
    warn: 1,
    error: 2
}

type LogType = keyof typeof LogLevel;

type LogHandler = Record<LogType, (msg: string) => void>;

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

  export { LogType, LogHandler, logHandlerFactory };