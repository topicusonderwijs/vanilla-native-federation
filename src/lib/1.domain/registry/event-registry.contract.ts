import type {
  NFEventConsumer,
  NFEventData,
  NFEventProvider,
  NFEventUnsubscribe,
} from './event.contract';

export type NFEventRegistry = {
  register<T>(name: string, resource: T | NFEventProvider<T>): Promise<void>;
  onReady<T>(name: string, callback: NFEventConsumer<T>): NFEventUnsubscribe;
  emit<T>(type: string, data: T): void;
  on<T>(type: string, callback: NFEventConsumer<NFEventData<T>>): NFEventUnsubscribe;
};
