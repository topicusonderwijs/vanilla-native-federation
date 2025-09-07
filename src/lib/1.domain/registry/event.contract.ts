export type NFEventProvider<T> = () => Promise<T> | T;
export type NFEventConsumer<T> = (resource: T) => void;
export type NFEventErrorHandler = (name: string, error: Error) => void;
