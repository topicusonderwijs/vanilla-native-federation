import type {
  NFEventConsumer,
  NFEventData,
  NFEventProvider,
  NFEventUnsubscribe,
} from '../../../1.domain/registry/event.contract';
import type { ForManagingEvents } from 'lib/2.app/driver-ports/registry/for-managing-events.port';
import type { NFEventRegistryConfig } from 'lib/2.app/config/registry.contract';

export function createRegistry(opts: NFEventRegistryConfig): ForManagingEvents {
  // resources
  const resources = new Map<string, unknown>();
  const pending = new Map<string, Set<NFEventConsumer<any>>>();

  // events
  const events = new Map<string, NFEventData[]>();
  const listeners = new Map<string, Set<NFEventConsumer<NFEventData<any>>>>();
  const recentlyUsedEvents = new Set<string>();

  const REMOVE_EVENTS = Math.ceil(opts.maxEvents * opts.removePercentage);

  /**
   * RESOURCE: Register a resource by name. If the resource is a provider function, it is
   * invoked to obtain the actual resource. All callbacks waiting for this
   * resource via `onReady` are invoked once the resource is registered.
   */
  const register = async <T>(type: string, resource: T | NFEventProvider<T>): Promise<void> => {
    const value =
      typeof resource === 'function' ? await (resource as NFEventProvider<T>)() : resource;

    resources.set(type, value);

    const callbacks = pending.get(type);
    if (callbacks) {
      pending.delete(type);
      callbacks.forEach(cb => cb(value));
    }
  };

  /**
   * RESOURCE: Subscribe to the readiness of a resource. If the resource is already
   * registered, the callback is invoked immediately. Otherwise, the callback
   * is invoked once the resource is registered.
   */
  const onReady = <T>(type: string, callback: NFEventConsumer<T>): NFEventUnsubscribe => {
    const existing = resources.get(type);
    if (existing !== undefined) {
      callback(existing as T);
      return () => {};
    }

    let callbacks = pending.get(type);
    if (!callbacks) {
      callbacks = new Set();
      pending.set(type, callbacks);
    }
    callbacks.add(callback);

    return () => {
      callbacks!.delete(callback);
      if (callbacks!.size === 0) {
        pending.delete(type);
      }
    };
  };

  /**
   * EVENT: Subscribe to events of a specific type. The callback is invoked for all
   * past events of that type, and for all future events.
   */
  const on = <T>(type: string, callback: NFEventConsumer<NFEventData<T>>): NFEventUnsubscribe => {
    const history = events.get(type);
    const historyCopy = history ? [...history] : null;

    let typeListeners = listeners.get(type);
    if (!typeListeners) {
      typeListeners = new Set();
      listeners.set(type, typeListeners);
    }
    typeListeners.add(callback);

    if (historyCopy && historyCopy.length > 0) {
      queueMicrotask(() => {
        historyCopy.forEach(event => callback(event));
      });
    }

    return () => {
      typeListeners!.delete(callback);
      if (typeListeners!.size === 0) {
        listeners.delete(type);
      }
    };
  };

  /**
   * Emit an event of a specific type with associated data. The event is stored
   * in the history for that type, and all listeners subscribed to that type are
   * invoked with the new event. If the number of stored events exceeds
   * the maximum, the oldest events are removed based on the configured
   * removal percentage. If the number of event types exceeds the maximum,
   * the oldest event type and its history are removed.
   */
  const emit = <T>(type: string, data: T): void => {
    const event: NFEventData<T> = {
      data,
      timestamp: Date.now(),
    };

    recentlyUsedEvents.delete(type);
    recentlyUsedEvents.add(type);

    if (recentlyUsedEvents.size > opts.maxStreams) {
      const oldest = recentlyUsedEvents.values().next().value;
      if (oldest) {
        recentlyUsedEvents.delete(oldest);
        events.delete(oldest);
      }
    }

    let history = events.get(type) || [];
    history.push(event);

    if (history.length > opts.maxEvents) {
      history = history.slice(-(opts.maxEvents - REMOVE_EVENTS));
    }

    events.set(type, history);

    const typeListeners = listeners.get(type);
    if (typeListeners && typeListeners.size > 0) {
      typeListeners.forEach(listener => listener(event));
    }
  };

  const clear = (type?: string): void => {
    if (type) {
      // Clear event-related data
      events.delete(type);
      listeners.delete(type);

      // Clear resource-related data
      resources.delete(type);
      pending.delete(type);

      recentlyUsedEvents.delete(type);
    } else {
      // Clear all data
      events.clear();
      listeners.clear();
      pending.clear();
      resources.clear();
      recentlyUsedEvents.clear();
    }
  };

  return () => ({
    register,
    onReady,
    emit,
    on,
    clear,
  });
}
