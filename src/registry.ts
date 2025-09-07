import type { ResourceRegistry } from './lib/1.domain/registry/resource-registry.contract';
import type { RegistryOptions } from './lib/1.domain/registry/registry-options.contract';
import type { NFEventConsumer, NFEventProvider } from './lib/1.domain/registry/event.contract';

(function (): void {
  const resources: Record<string, any> = {};
  const pending: Record<string, Array<{ resolve: Function; reject: Function }>> = {};
  const errors: Record<string, Error> = {};

  const withTimeout = <T>(promise: Promise<T>, ms: number, name: string): Promise<T> =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${name} (${ms}ms)`)), ms)
      ),
    ]);

  const withRetry = async <T>(fn: () => Promise<T>, attempts: number = 3): Promise<T> => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === attempts - 1) throw err;
      }
    }
    throw new Error('Retry failed');
  };

  const resolve = <T>(name: string, resource: T, ttl: number = 0): void => {
    resources[name] = resource;
    delete errors[name];

    pending[name]?.forEach(({ resolve }) => resolve(resource));
    delete pending[name];

    if (ttl > 0) {
      setTimeout(() => {
        delete resources[name];
      }, ttl);
    }
  };

  const reject = (name: string, error: Error, ttl: number = 0): void => {
    errors[name] = error;
    pending[name]?.forEach(({ reject }) => reject(error));
    delete pending[name];

    if (ttl > 0) {
      setTimeout(() => {
        delete errors[name];
      }, ttl);
    }
  };

  (window as unknown as { __NF_REGISTRY__: ResourceRegistry }).__NF_REGISTRY__ = Object.freeze({
    async register<R>(
      name: string,
      resource: R | NFEventProvider<R>,
      ttl: number = 0
    ): Promise<void> {
      try {
        const resolved =
          typeof resource === 'function' ? await (resource as NFEventProvider<R>)() : resource;
        resolve(name, resolved, ttl);
      } catch (error) {
        reject(name, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },

    async get<R>(name: string, options: RegistryOptions = {}): Promise<R> {
      const { timeout, retries, onError } = { timeout: 0, retries: 0, ...options };

      if (!!resources[name]) return resources[name];
      if (!!errors[name]) {
        const error = errors[name];
        onError?.(name, error);
        throw error;
      }

      const promise = new Promise<R>((resolve, reject) => {
        if (!pending[name]) pending[name] = [];
        pending[name].push({ resolve, reject });
      });

      const timedPromise = timeout > 0 ? withTimeout(promise, timeout, name) : promise;
      return retries > 0 ? withRetry(() => timedPromise, retries) : timedPromise;
    },

    has(name: string): boolean {
      return !!resources[name];
    },

    clear(name?: string): void {
      if (name) {
        delete resources[name];
        delete errors[name];
        pending[name]?.forEach(({ reject }) => reject(new Error(`Resource '${name}' cleared`)));
        delete pending[name];
        return;
      }

      var props = Object.getOwnPropertyNames(resources);
      for (var i = 0; i < props.length; i++) delete resources[props[i]!];

      var props = Object.getOwnPropertyNames(errors);
      for (var i = 0; i < props.length; i++) delete errors[props[i]!];

      Object.values(pending ?? {}).forEach(waiters =>
        waiters.forEach(({ reject }) => reject(new Error('Registry cleared')))
      );

      var props = Object.getOwnPropertyNames(pending);
      for (var i = 0; i < props.length; i++) delete pending[props[i]!];
    },

    onReady<R>(name: string, callback: NFEventConsumer<R>): void {
      if (!!resources[name]) {
        callback(resources[name]);
      } else {
        this.get<R>(name)
          .then(callback)
          .catch(() => {});
      }
    },
  });
})();
