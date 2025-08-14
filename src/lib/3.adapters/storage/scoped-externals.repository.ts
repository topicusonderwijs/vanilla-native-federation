import type { ScopedExternals } from 'lib/1.domain/externals/external.contract';
import type { StorageConfig, StorageEntry } from 'lib/2.app/config/storage.contract';
import type { ForScopedExternalsStorage } from 'lib/2.app/driving-ports/for-scoped-externals-storage.port';
import type { RemoteName, ScopedVersion } from 'lib/1.domain';
import { Optional } from 'lib/utils/optional';

const createScopedExternalsRepository = (config: StorageConfig): ForScopedExternalsStorage => {
  const STORAGE: StorageEntry<ScopedExternals> = config.storage('scoped-externals', {});

  if (config.clearStorage) STORAGE.clear();

  const _cache: ScopedExternals = STORAGE.get() ?? {};

  return {
    addExternal: function (remoteName: RemoteName, external: string, version: ScopedVersion) {
      if (!_cache[remoteName]) _cache[remoteName] = {};
      _cache[remoteName][external] = version;
      return this;
    },
    remove: function (remoteName: RemoteName) {
      delete _cache[remoteName];
      return this;
    },
    getAll: function () {
      return _cache;
    },
    tryGet: function (remoteName: string) {
      return Optional.of(_cache[remoteName]);
    },
    commit: function () {
      STORAGE.set(_cache);
      return this;
    },
  };
};

export { createScopedExternalsRepository };
