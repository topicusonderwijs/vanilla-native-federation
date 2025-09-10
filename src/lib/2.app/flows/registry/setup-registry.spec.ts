import type { NFEventRegistryConfig } from 'lib/2.app/config/registry.contract';
import type { NFEventRegistry } from 'lib/1.domain/registry/event-registry.contract';
import type { NFEventProvider, NFEventUnsubscribe } from 'lib/1.domain/registry/event.contract';
import { createRegistry } from './setup-registry';

describe('createRegistry', () => {
  let config: NFEventRegistryConfig;
  let registry: NFEventRegistry;

  beforeEach(() => {
    config = {
      maxStreams: 10,
      maxEvents: 100,
      removePercentage: 0.2,
    };
    registry = createRegistry(config)();
  });

  describe('register', () => {
    it('should register a resource by name with a direct value', async () => {
      const testValue = { test: 'data' };

      await registry.register('test-resource', testValue);

      const callback = jest.fn();
      registry.onReady('test-resource', callback);

      expect(callback).toHaveBeenCalledWith(testValue);
    });

    it('should register a resource by name with a provider function', async () => {
      const testValue = { test: 'data' };
      const provider: NFEventProvider<typeof testValue> = jest.fn().mockResolvedValue(testValue);

      await registry.register('test-resource', provider);

      expect(provider).toHaveBeenCalled();

      const callback = jest.fn();
      registry.onReady('test-resource', callback);

      expect(callback).toHaveBeenCalledWith(testValue);
    });

    it('should register a resource with a synchronous provider function', async () => {
      const testValue = { test: 'data' };
      const provider: NFEventProvider<typeof testValue> = jest.fn().mockReturnValue(testValue);

      await registry.register('test-resource', provider);

      expect(provider).toHaveBeenCalled();

      const callback = jest.fn();
      registry.onReady('test-resource', callback);

      expect(callback).toHaveBeenCalledWith(testValue);
    });

    it('should trigger pending callbacks when resource is registered', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testValue = { test: 'data' };

      registry.onReady('test-resource', callback1);
      registry.onReady('test-resource', callback2);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      await registry.register('test-resource', testValue);

      expect(callback1).toHaveBeenCalledWith(testValue);
      expect(callback2).toHaveBeenCalledWith(testValue);
    });
  });

  describe('onReady', () => {
    it('should call callback immediately if resource is already registered', async () => {
      const testValue = { test: 'data' };
      await registry.register('test-resource', testValue);

      const callback = jest.fn();
      registry.onReady('test-resource', callback);

      expect(callback).toHaveBeenCalledWith(testValue);
    });

    it('should wait for resource to be registered before calling callback', async () => {
      const callback = jest.fn();
      const testValue = { test: 'data' };

      registry.onReady('test-resource', callback);
      expect(callback).not.toHaveBeenCalled();

      await registry.register('test-resource', testValue);
      expect(callback).toHaveBeenCalledWith(testValue);
    });

    it('should return an unsubscribe function that removes the callback', async () => {
      const callback = jest.fn();
      const testValue = { test: 'data' };

      const unsubscribe = registry.onReady('test-resource', callback);
      unsubscribe();

      await registry.register('test-resource', testValue);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return a no-op unsubscribe function when resource is already registered', async () => {
      const testValue = { test: 'data' };
      await registry.register('test-resource', testValue);

      const callback = jest.fn();
      const unsubscribe = registry.onReady('test-resource', callback);

      expect(callback).toHaveBeenCalledWith(testValue);
      expect(typeof unsubscribe).toBe('function');

      expect(() => unsubscribe()).not.toThrow();
    });

    it('should clean up pending map when all callbacks are unsubscribed', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = registry.onReady('test-resource', callback1);
      const unsubscribe2 = registry.onReady('test-resource', callback2);

      unsubscribe1();
      unsubscribe2();

      const testValue = { test: 'data' };
      await registry.register('test-resource', testValue);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should emit an event with data and timestamp', () => {
      const callback = jest.fn();
      const testData = { message: 'test' };
      const beforeEmit = Date.now();

      registry.on('test-event', callback);
      registry.emit('test-event', testData);

      const afterEmit = Date.now();

      expect(callback).toHaveBeenCalledWith({
        data: testData,
        timestamp: expect.any(Number),
      });

      const event = callback.mock.calls[0][0];
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeEmit);
      expect(event.timestamp).toBeLessThanOrEqual(afterEmit);
    });

    it('should emit events to all registered listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testData = { message: 'test' };

      registry.on('test-event', callback1);
      registry.on('test-event', callback2);
      registry.emit('test-event', testData);

      expect(callback1).toHaveBeenCalledWith(expect.objectContaining({ data: testData }));
      expect(callback2).toHaveBeenCalledWith(expect.objectContaining({ data: testData }));
    });

    it('should store events in history for future subscribers', () => {
      const testData = { message: 'test' };

      registry.emit('test-event', testData);

      const callback = jest.fn();
      registry.on('test-event', callback);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: testData }));
          resolve();
        }, 0);
      });
    });

    it('should limit the number of events per type according to maxEvents config', () => {
      const smallConfig = { maxStreams: 10, maxEvents: 3, removePercentage: 0.5 };
      const smallRegistry = createRegistry(smallConfig)();

      const callback = jest.fn();
      smallRegistry.on('test-event', callback);

      for (let i = 1; i <= 5; i++) {
        smallRegistry.emit('test-event', { id: i });
      }

      callback.mockClear();

      const historyCallback = jest.fn();
      smallRegistry.on('test-event', historyCallback);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          // Should only have the most recent events (maxEvents - removeEvents)
          // removeEvents = Math.ceil(3 * 0.5) = 2
          // remaining = 3 - 2 = 1
          // However, the cleanup happens only when exceeding maxEvents:
          // After event 4: history.length = 4 > 3, so slice(-(3-2)) = slice(-1) keeps [event4]
          // After event 5: history = [event4, event5], length = 2 ≤ 3, no cleanup
          expect(historyCallback).toHaveBeenCalledTimes(2);
          expect(historyCallback).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ data: { id: 4 } })
          );
          expect(historyCallback).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ data: { id: 5 } })
          );
          resolve();
        }, 0);
      });
    });

    it('should remove old event types when maxStreams is exceeded', () => {
      const smallConfig = { maxStreams: 2, maxEvents: 10, removePercentage: 0.2 };
      const smallRegistry = createRegistry(smallConfig)();

      smallRegistry.emit('type1', { id: 1 });
      smallRegistry.emit('type2', { id: 2 });
      smallRegistry.emit('type3', { id: 3 }); // This should remove type1

      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      smallRegistry.on('type1', callback1);
      smallRegistry.on('type2', callback2);
      smallRegistry.on('type3', callback3);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(callback1).not.toHaveBeenCalled();
          expect(callback2).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 2 } }));
          expect(callback3).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 3 } }));
          resolve();
        }, 0);
      });
    });

    it('should not emit to listeners if no listeners are registered', () => {
      expect(() => registry.emit('test-event', { data: 'test' })).not.toThrow();
    });
  });

  describe('on', () => {
    it('should subscribe to events and receive future events', () => {
      const callback = jest.fn();
      const testData = { message: 'test' };

      registry.on('test-event', callback);
      registry.emit('test-event', testData);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: testData }));
    });

    it('should receive historical events when subscribing', () => {
      const testData1 = { message: 'first' };
      const testData2 = { message: 'second' };

      registry.emit('test-event', testData1);
      registry.emit('test-event', testData2);

      const callback = jest.fn();
      registry.on('test-event', callback);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalledTimes(2);
          expect(callback).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: testData1 }));
          expect(callback).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: testData2 }));
          resolve();
        }, 0);
      });
    });

    it('should return an unsubscribe function that removes the listener', () => {
      const callback = jest.fn();
      const testData = { message: 'test' };

      const unsubscribe = registry.on('test-event', callback);
      unsubscribe();

      registry.emit('test-event', testData);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should clean up listeners map when all listeners are unsubscribed', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = registry.on('test-event', callback1);
      const unsubscribe2 = registry.on('test-event', callback2);

      unsubscribe1();
      unsubscribe2();

      const testData = { message: 'test' };
      registry.emit('test-event', testData);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle multiple subscriptions to the same event type', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testData = { message: 'test' };

      registry.on('test-event', callback1);
      registry.on('test-event', callback2);
      registry.emit('test-event', testData);

      expect(callback1).toHaveBeenCalledWith(expect.objectContaining({ data: testData }));
      expect(callback2).toHaveBeenCalledWith(expect.objectContaining({ data: testData }));
    });

    it('should not receive historical events if there are none', () => {
      const callback = jest.fn();

      registry.on('test-event', callback);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(callback).not.toHaveBeenCalled();
          resolve();
        }, 0);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex workflow with registration, events, and subscriptions', async () => {
      const resourceCallback = jest.fn();
      const eventCallback = jest.fn();

      registry.onReady('app-ready', resourceCallback);
      registry.on('app-event', eventCallback);

      registry.emit('app-event', { phase: 'init' });
      registry.emit('app-event', { phase: 'loading' });

      await registry.register('app-ready', { status: 'ready' });

      registry.emit('app-event', { phase: 'ready' });

      expect(resourceCallback).toHaveBeenCalledWith({ status: 'ready' });
      expect(eventCallback).toHaveBeenCalledTimes(3);
      expect(eventCallback).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: { phase: 'init' } })
      );
      expect(eventCallback).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ data: { phase: 'loading' } })
      );
      expect(eventCallback).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ data: { phase: 'ready' } })
      );
    });

    it('should handle unsubscription during event emission', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      let unsubscribe1: NFEventUnsubscribe;

      callback1.mockImplementation(() => {
        unsubscribe1();
      });

      unsubscribe1 = registry.on('test-event', callback1);
      registry.on('test-event', callback2);

      registry.emit('test-event', { data: 'test' });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      registry.emit('test-event', { data: 'test2' });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
    });

    it('should maintain separate state for different registry instances', () => {
      const registry2 = createRegistry(config)();

      registry.emit('test-event', { source: 'registry1' });
      registry2.emit('test-event', { source: 'registry2' });

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      registry.on('test-event', callback1);
      registry2.on('test-event', callback2);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(callback1).toHaveBeenCalledWith(
            expect.objectContaining({ data: { source: 'registry1' } })
          );
          expect(callback2).toHaveBeenCalledWith(
            expect.objectContaining({ data: { source: 'registry2' } })
          );
          resolve();
        }, 0);
      });
    });
  });

  describe('clear', () => {
    it('should clear all registry state when called without parameters', () => {
      const callback = jest.fn();
      const pendingCallback = jest.fn();

      // Set up some state
      registry.emit('test-event', { data: 'test' });
      registry.on('test-event', callback);
      registry.onReady('test-resource', pendingCallback);

      // Clear everything
      registry.clear();

      // Verify events are cleared
      const newCallback = jest.fn();
      registry.on('test-event', newCallback);

      setTimeout(() => {
        expect(newCallback).not.toHaveBeenCalled();
      }, 0);

      // Verify listeners are cleared
      registry.emit('test-event', { data: 'new-test' });
      expect(callback).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { data: 'new-test' } })
      );

      // Verify pending callbacks are cleared
      registry.register('test-resource', { value: 'test' });
      expect(pendingCallback).not.toHaveBeenCalled();
    });

    it('should clear only specific event type when type parameter is provided', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const pendingCallback1 = jest.fn();
      const pendingCallback2 = jest.fn();

      // Set up events
      registry.emit('event-type-1', { data: 'test1' });
      registry.emit('event-type-2', { data: 'test2' });

      registry.on('event-type-1', callback1);
      registry.on('event-type-2', callback2);

      // Set up resources with same names as event types
      registry.onReady('event-type-1', pendingCallback1);
      registry.onReady('event-type-2', pendingCallback2);

      // Register one resource
      await registry.register('event-type-2', { value: 'resource2' });
      expect(pendingCallback2).toHaveBeenCalledWith({ value: 'resource2' });

      // Clear only one event type/resource
      registry.clear('event-type-1');

      // Verify event-type-1 is cleared (events, listeners, pending)
      const newCallback1 = jest.fn();
      registry.on('event-type-1', newCallback1);

      setTimeout(() => {
        expect(newCallback1).not.toHaveBeenCalled();
      }, 0);

      // Verify pending for event-type-1 is cleared
      await registry.register('event-type-1', { value: 'resource1' });
      expect(pendingCallback1).not.toHaveBeenCalled();

      // Verify event-type-2 still has history and registered resource
      const newCallback2 = jest.fn();
      registry.on('event-type-2', newCallback2);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(newCallback2).toHaveBeenCalledWith(
            expect.objectContaining({ data: { data: 'test2' } })
          );

          // Verify the registered resource for event-type-2 is still available
          const immediateCallback = jest.fn();
          registry.onReady('event-type-2', immediateCallback);
          expect(immediateCallback).toHaveBeenCalledWith({ value: 'resource2' });

          resolve();
        }, 0);
      });
    });
  });
});
