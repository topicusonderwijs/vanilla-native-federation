import type { LoggingConfig } from "lib/2.app/config/log.contract";
import { noopLogger } from "./noop.logger";
import { createLogHandler } from "./log.handler";

export const createLogConfig = ({log, logLevel}: Partial<LoggingConfig>): LoggingConfig => ({
    log: createLogHandler(log ?? noopLogger, logLevel ?? "error" ),
    logLevel: logLevel ?? "error" 
});