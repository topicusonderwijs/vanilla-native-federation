import type { NFEventConsumer, NFEventData, NFEventProvider } from './event.contract';

export type NFEventRegistry = {
  register<T>(name: string, resource: T | NFEventProvider<T>): Promise<void>;
  onReady<T>(name: string, callback: NFEventConsumer<T>): void;
  emit<T>(type: string, data: T): void;
  on<T>(type: string, callback: NFEventConsumer<NFEventData<T>>): void;
};
