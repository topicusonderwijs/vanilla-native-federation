import type { RegistryOptions } from './registry-options.contract';
import type { NFEventConsumer, NFEventProvider } from './event.contract';

export interface ResourceRegistry<T = any> {
  register<R extends T>(
    name: string,
    resource: R | NFEventProvider<R>,
    timeout?: number
  ): Promise<void>;
  get<R extends T>(name: string, options?: RegistryOptions): Promise<R>;
  has(name: string): boolean;
  clear(name?: string): void;
  onReady<R extends T>(name: string, callback: NFEventConsumer<R>): void;
}
