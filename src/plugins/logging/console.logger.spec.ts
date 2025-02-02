import { consoleLogger } from './console.logger';

describe('consoleLogger', () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  it('should log debug messages with correct prefix', () => {
    consoleLogger.debug('test debug message');
    expect(console.log).toHaveBeenCalledWith('[DEBUG]: test debug message');
  });

  it('should log error messages with correct prefix', () => {
    consoleLogger.error('test error message');
    expect(console.error).toHaveBeenCalledWith('[NF]: test error message');
  });

  it('should log warning messages with correct prefix', () => {
    consoleLogger.warn('test warning message');
    expect(console.warn).toHaveBeenCalledWith('[NF]: test warning message');
  });

  it('should call appropriate console methods for each level', () => {
    consoleLogger.debug('debug');
    consoleLogger.error('error');
    consoleLogger.warn('warn');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});