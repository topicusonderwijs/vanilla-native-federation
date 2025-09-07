export type NFEventProvider<T> = () => Promise<T> | T;
export type NFEventConsumer<T> = (resource: T) => void;
export type NFEventErrorHandler = (name: string, error: Error) => void;

export type NFEventData<T = any> = {
  data: T;
  timestamp: number;
};

export type NFEventUnsubscribe = () => void;

export type NFEventStream<T = any> = {
  events: NFEventData<T>[];
  latest: NFEventData<T> | null;
  count: number;
  firstEvent: number | null;
  lastEvent: number | null;
};
