import type {
  NFEventConsumer,
  NFEventData,
  NFEventProvider,
  NFEventUnsubscribe,
} from './lib/1.domain/registry/event.contract';
import type { NFEventRegistry } from './lib/1.domain/registry/event-registry.contract';

declare global {
  interface Window {
    __NF_REGISTRY__: NFEventRegistry;
  }
}

(function (): void {
  const script = document.currentScript as HTMLScriptElement | null;

  // Maximum number of different event types to keep in the registry.
  const MAX_EVENT_STREAMS = script?.dataset?.maxStreams //
    ? Number(script.dataset.maxStreams)
    : 50;

  // Maximum number of events to keep in the history for each event type.
  const MAX_EVENTS = script?.dataset?.maxEvents //
    ? Number(script.dataset.maxEvents)
    : 50;

  // When trimming events, remove this percentage of the oldest events.
  // E.g. with 0.25 and maxEvents=50, when the 51st event is added, the oldest 12 events are removed,
  // leaving 38 events in the history.
  const removePercentage = script?.dataset?.removePercentage //
    ? Number(script.dataset.removePercentage) / 100
    : 0.5;
  const REMOVE_EVENTS = Math.ceil(MAX_EVENTS * removePercentage);

  const store = new Map<string, unknown>();
  const pending = new Map<string, Set<NFEventConsumer<any>>>();
  const events = new Map<string, NFEventData[]>();
  const listeners = new Map<string, Set<NFEventConsumer<NFEventData<any>>>>();
  const recentlyUsedTypes = new Set<string>();

  const onReady = <T>(name: string, callback: NFEventConsumer<T>): NFEventUnsubscribe => {
    const existing = store.get(name);
    if (existing !== undefined) {
      callback(existing as T);
      return () => {};
    }

    let callbacks = pending.get(name);
    if (!callbacks) {
      callbacks = new Set();
      pending.set(name, callbacks);
    }
    callbacks.add(callback);

    return () => {
      callbacks!.delete(callback);
      if (callbacks!.size === 0) {
        pending.delete(name);
      }
    };
  };

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

  const register = async <T>(name: string, resource: T | NFEventProvider<T>): Promise<void> => {
    const value =
      typeof resource === 'function' ? await (resource as NFEventProvider<T>)() : resource;

    store.set(name, value);

    const callbacks = pending.get(name);
    if (callbacks) {
      pending.delete(name);
      callbacks.forEach(cb => cb(value));
    }
  };

  const emit = <T>(type: string, data: T): void => {
    const event: NFEventData<T> = {
      data,
      timestamp: Date.now(),
    };

    recentlyUsedTypes.delete(type);
    recentlyUsedTypes.add(type);

    if (recentlyUsedTypes.size > MAX_EVENT_STREAMS) {
      const oldest = recentlyUsedTypes.values().next().value;
      if (oldest) {
        recentlyUsedTypes.delete(oldest);
        events.delete(oldest);
      }
    }

    let history = events.get(type) || [];
    history.push(event);

    if (history.length > MAX_EVENTS) {
      history = history.slice(-(MAX_EVENTS - REMOVE_EVENTS));
    }

    events.set(type, history);

    const typeListeners = listeners.get(type);
    if (typeListeners && typeListeners.size > 0) {
      typeListeners.forEach(listener => listener(event));
    }
  };

  window.__NF_REGISTRY__ = Object.freeze({
    register,
    onReady,
    emit,
    on,
  });
})();
