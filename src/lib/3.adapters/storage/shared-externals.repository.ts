import {
  type SharedExternal,
  type SharedExternals,
  GLOBAL_SCOPE,
  STRICT_SCOPE,
} from 'lib/1.domain/externals/external.contract';
import type { StorageConfig, StorageEntry } from 'lib/2.app/config/storage.contract';
import type { ForSharedExternalsStorage } from 'lib/2.app/driving-ports/for-shared-externals-storage.port';
import { Optional } from 'lib/utils/optional';

const createSharedExternalsRepository = (config: StorageConfig): ForSharedExternalsStorage => {
  const STORAGE: StorageEntry<SharedExternals> = config.storage<SharedExternals>(
    'shared-externals',
    { [GLOBAL_SCOPE]: {} }
  );

  if (config.clearStorage) STORAGE.clear();

  const _cache: SharedExternals = STORAGE.get()!;

  return {
    getAll: function (shareScope?: string) {
      return { ..._cache[shareScope ?? GLOBAL_SCOPE] };
    },
    addOrUpdate: function (externalName: string, external: SharedExternal, shareScope?: string) {
      if (!_cache[shareScope ?? GLOBAL_SCOPE]) _cache[shareScope ?? GLOBAL_SCOPE] = {};
      _cache[shareScope ?? GLOBAL_SCOPE]![externalName] = external;
      return this;
    },
    getScopes: function (o = { includeGlobal: true }) {
      if (o.includeGlobal) return Object.keys(_cache);
      return Object.keys(_cache).filter(s => s !== GLOBAL_SCOPE);
    },
    scopeType: function (shareScope?: string) {
      switch (shareScope) {
        case GLOBAL_SCOPE:
        case null:
        case undefined:
          return 'global';
        case STRICT_SCOPE:
          return 'strict';
        default:
          return 'shareScope';
      }
    },
    tryGetVersions: function (external: string, shareScope?: string) {
      return Optional.of(_cache[shareScope ?? GLOBAL_SCOPE]?.[external]?.versions);
    },
    commit: function () {
      STORAGE.set(_cache);
      return this;
    },
  };
};

export { createSharedExternalsRepository };
