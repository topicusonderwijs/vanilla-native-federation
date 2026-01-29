jest.mock('@softarc/native-federation/domain', () => ({
  BuildNotificationType: {
    COMPLETED: 'federation-rebuild-complete',
    ERROR: 'federation-rebuild-error',
    CANCELLED: 'federation-rebuild-cancelled',
  },
}));

import { createSSEHandler } from './sse-handler';
import { ImportMapConfig } from 'lib/2.app/config/import-map.contract';
import { ForSSE } from 'lib/2.app/driving-ports/for-sse.port';
import { BuildNotificationType } from '@softarc/native-federation/domain';

describe('createSSEHandler', () => {
  let sseHandler: ForSSE;
  let mockConfig: ImportMapConfig;
  let mockEventSource: jest.Mocked<EventSource>;
  let eventSourceConstructorSpy: jest.Mock;
  let mockReloadBrowserFn: jest.Mock;

  beforeEach(() => {
    // Mock EventSource
    mockEventSource = {
      onmessage: null,
      onerror: null,
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2,
      readyState: 0,
      url: '',
      withCredentials: false,
      onopen: null,
    } as any;

    // Mock EventSource constructor on window (not global for jsdom)
    (window as any).EventSource = jest.fn(() => mockEventSource);
    eventSourceConstructorSpy = (window as any).EventSource;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    mockReloadBrowserFn = jest.fn();
    mockConfig = {
      loadModuleFn: jest.fn(),
      setImportMapFn: jest.fn(),
      reloadBrowserFn: mockReloadBrowserFn,
    };

    sseHandler = createSSEHandler(mockConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (window as any).EventSource;
  });

  describe('watchRemoteBuilds', () => {
    it('should create an EventSource with the provided endpoint', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      expect(eventSourceConstructorSpy).toHaveBeenCalledWith(endpoint);
    });

    it('should reload the page when a COMPLETED build notification is received', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      // Simulate an SSE message
      const event = {
        data: JSON.stringify({ type: BuildNotificationType.COMPLETED }),
      } as MessageEvent;

      mockEventSource.onmessage!(event);

      expect(console.log).toHaveBeenCalledWith('[Federation] Rebuild completed, reloading...');
      expect(mockReloadBrowserFn).toHaveBeenCalled();
    });

    it('should not reload the page when a non-COMPLETED build notification is received', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      // Simulate an SSE message with a different type
      const event = {
        data: JSON.stringify({ type: 'STARTED' }),
      } as MessageEvent;

      mockEventSource.onmessage!(event);

      expect(mockReloadBrowserFn).not.toHaveBeenCalled();
    });

    it('should log a warning when an SSE error occurs', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      // Simulate an error event
      const errorEvent = new Event('error');

      mockEventSource.onerror!(errorEvent);

      expect(console.warn).toHaveBeenCalledWith('[Federation] SSE connection error:', errorEvent);
    });

    it('should handle malformed JSON in SSE messages', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      // Simulate an SSE message with malformed JSON
      const event = {
        data: 'invalid-json',
      } as MessageEvent;

      expect(() => mockEventSource.onmessage!(event)).toThrow();
    });

    it('should handle SSE messages with missing type field', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      // Simulate an SSE message without a type field
      const event = {
        data: JSON.stringify({ someOtherField: 'value' }),
      } as MessageEvent;

      mockEventSource.onmessage!(event);

      expect(mockReloadBrowserFn).not.toHaveBeenCalled();
    });

    it('should create multiple EventSource instances when called multiple times', () => {
      const endpoint1 = 'https://example.com/sse-endpoint-1';
      const endpoint2 = 'https://example.com/sse-endpoint-2';

      sseHandler.watchRemoteBuilds(endpoint1);
      sseHandler.watchRemoteBuilds(endpoint2);

      expect(eventSourceConstructorSpy).toHaveBeenCalledTimes(2);
      expect(eventSourceConstructorSpy).toHaveBeenNthCalledWith(1, endpoint1);
      expect(eventSourceConstructorSpy).toHaveBeenNthCalledWith(2, endpoint2);
    });

    it('should handle SSE messages with additional data fields', () => {
      const endpoint = 'https://example.com/sse-endpoint';

      sseHandler.watchRemoteBuilds(endpoint);

      // Simulate an SSE message with additional fields
      const event = {
        data: JSON.stringify({
          type: BuildNotificationType.COMPLETED,
          timestamp: Date.now(),
          buildId: 'abc123',
        }),
      } as MessageEvent;

      mockEventSource.onmessage!(event);

      expect(console.log).toHaveBeenCalledWith('[Federation] Rebuild completed, reloading...');
      expect(mockReloadBrowserFn).toHaveBeenCalled();
    });
  });
});
