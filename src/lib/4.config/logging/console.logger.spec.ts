import { consoleLogger } from './console.logger';

describe('consoleLogger', () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
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
    consoleLogger.debug(0, 'test debug message');
    expect(console.log).toHaveBeenCalledWith('[DEBUG][0]: test debug message');

    consoleLogger.debug(1, 'test debug message', new Error('Something went wrong'));
    expect(console.log).toHaveBeenCalledWith(
      '[DEBUG][1]: test debug message',
      new Error('Something went wrong')
    );
  });

  it('should log error messages with correct prefix', () => {
    consoleLogger.error(0, 'test error message');
    expect(console.error).toHaveBeenCalledWith('[NF][0]: test error message');

    consoleLogger.error(1, 'test error message', new Error('Something went wrong'));
    expect(console.error).toHaveBeenCalledWith(
      '[NF][1]: test error message',
      new Error('Something went wrong')
    );
  });

  it('should log warning messages with correct prefix', () => {
    consoleLogger.warn(0, 'test warning message');
    expect(console.warn).toHaveBeenCalledWith('[NF][0]: test warning message');

    consoleLogger.warn(1, 'test warning message', new Error('Something went wrong'));
    expect(console.warn).toHaveBeenCalledWith(
      '[NF][1]: test warning message',
      new Error('Something went wrong')
    );
  });

  it('should call appropriate console methods for each level', () => {
    consoleLogger.debug(0, 'debug');
    consoleLogger.error(0, 'error');
    consoleLogger.warn(0, 'warn');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
