import type { Config } from "../../utils";
import type { NfCache } from "../storage";
import { type LogHandler, type LogType, LogLevel } from "./log.contract";

const logHandlerFactory = ({logger, logLevel}: Config<NfCache>): LogHandler => {
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