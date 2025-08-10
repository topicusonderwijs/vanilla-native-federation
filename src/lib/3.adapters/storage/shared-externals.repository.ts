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
    getFromScope: function (shareScope?: string) {
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
    removeFromAllScopes: function (remoteName: string) {
      Object.values(_cache).forEach(scope => {
        const removeExternals: string[] = [];

        Object.entries(scope).forEach(([name, external]) => {
          const removeVersionIdx: number[] = [];
          external.versions.forEach((version, i) => {
            const versionRemoteIDX = version.remotes.findIndex(r => r.name === remoteName);
            if (~versionRemoteIDX) {
              version.remotes.splice(versionRemoteIDX, 1);
            }

            if (version.remotes.length === 0) removeVersionIdx.push(i);
          });

          if (removeVersionIdx.length > 0) {
            for (let i = removeVersionIdx.length - 1; i >= 0; i--) {
              external.versions.splice(removeVersionIdx[i]!, 1);
            }
            external.dirty = true;

            if (external.versions.length === 0) removeExternals.push(name);
          }
        });
        removeExternals.forEach(name => delete scope[name]);
      });
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
    tryGet: function (external: string, shareScope?: string) {
      return Optional.of(_cache[shareScope ?? GLOBAL_SCOPE]?.[external]);
    },
    commit: function () {
      STORAGE.set(_cache);
      return this;
    },
  };
};

export { createSharedExternalsRepository };
