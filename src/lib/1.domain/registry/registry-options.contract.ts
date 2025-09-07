import type { NFEventErrorHandler } from './event.contract';

export interface RegistryOptions {
  timeout?: number;
  retries?: number;
  onError?: NFEventErrorHandler;
}
