import type { ScopedExternals } from 'lib/1.domain/externals/external.contract';
import type { StorageConfig, StorageEntry } from 'lib/2.app/config/storage.contract';
import type { ForScopedExternalsStorage } from 'lib/2.app/driving-ports/for-scoped-externals-storage.port';
import type { Version } from 'lib/1.domain';

const createScopedExternalsRepository = (config: StorageConfig): ForScopedExternalsStorage => {
  const STORAGE: StorageEntry<ScopedExternals> = config.storage('scoped-externals', {});

  if (config.clearStorage) STORAGE.clear();

  const _cache: ScopedExternals = STORAGE.get() ?? {};

  return {
    addExternal: function (scope: string, external: string, version: Version) {
      if (!_cache[scope]) _cache[scope] = {};
      _cache[scope][external] = version;
      return this;
    },
    getAll: function () {
      return _cache;
    },
    commit: function () {
      STORAGE.set(_cache);
      return this;
    },
  };
};

export { createScopedExternalsRepository };
