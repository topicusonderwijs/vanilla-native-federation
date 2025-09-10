import type {
  NFEventConsumer,
  NFEventData,
  NFEventProvider,
  NFEventUnsubscribe,
} from './event.contract';

export type NFEventRegistry = {
  register<T>(type: string, resource: T | NFEventProvider<T>): Promise<void>;
  onReady<T>(type: string, callback: NFEventConsumer<T>): NFEventUnsubscribe;
  emit<T>(type: string, data: T): void;
  on<T>(type: string, callback: NFEventConsumer<NFEventData<T>>): NFEventUnsubscribe;
  clear(type?: string): void;
};
