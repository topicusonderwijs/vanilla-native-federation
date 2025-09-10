import { createRegistry } from 'lib/registry.index';
import type { NFEventRegistry } from './lib/1.domain/registry/event-registry.contract';
import type { NFEventRegistryConfig } from './lib/2.app/config/registry.contract';

declare global {
  interface Window {
    __NF_REGISTRY__: NFEventRegistry;
  }
}

(function (): void {
  const script = document.currentScript as HTMLScriptElement | null;

  const config: NFEventRegistryConfig = {
    // Maximum number of different event types to keep in the registry.
    maxStreams: script?.dataset?.maxStreams ? Number(script.dataset.maxStreams) : 50,

    // Maximum number of events to keep in the history for each event type.
    maxEvents: script?.dataset?.maxEvents ? Number(script.dataset.maxEvents) : 50,

    // When trimming events, remove this percentage of the oldest events.
    // E.g. with 0.25 and maxEvents=50, when the 51st event is added, the oldest 12 events are removed,
    // leaving 38 events in the history.
    removePercentage: script?.dataset?.removePercentage
      ? Number(script.dataset.removePercentage) / 100
      : 0.5,
  };

  const registry = createRegistry(config);

  window.__NF_REGISTRY__ = Object.freeze(registry());
})();
