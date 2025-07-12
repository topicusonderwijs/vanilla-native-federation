import type { LogHandler, LogType } from 'lib/2.app/config/log.contract';

export const createMockLogHandler = (level: LogType = 'debug'): jest.Mocked<LogHandler> => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  level,
});
