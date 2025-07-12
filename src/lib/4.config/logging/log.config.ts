import type { LoggingConfig, LoggingOptions } from 'lib/2.app/config/log.contract';
import { noopLogger } from './noop.logger';
import { createLogHandler } from './log.handler';

export const createLogConfig = ({ logger, logLevel }: LoggingOptions): LoggingConfig => ({
  log: createLogHandler(logger ?? noopLogger, logLevel ?? 'error'),
});
