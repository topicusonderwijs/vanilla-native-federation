import type { StorageConfig, StorageEntry } from 'lib/2.app/config/storage.contract';
import { ForSharedChunksStorage } from 'lib/2.app/driving-ports/for-shared-chunks-storage.port';
import { SharedChunks } from 'lib/1.domain/externals/chunks.contract';
import { Optional } from 'lib/sdk.index';

const createChunkRepository = (config: StorageConfig): ForSharedChunksStorage => {
  const STORAGE: StorageEntry<SharedChunks> = config.storage('shared-chunks', {});

  if (config.clearStorage) STORAGE.clear();

  const _cache: SharedChunks = STORAGE.get() ?? {};

  return {
    addOrReplace: function (remoteName: string, bundleName: string, chunks: string[]) {
      if (!_cache[remoteName]) _cache[remoteName] = {};
      _cache[remoteName][bundleName] = chunks;
      return this;
    },
    tryGet: function (remoteName: string, bundleName: string) {
      return Optional.of(_cache[remoteName]?.[bundleName]);
    },
    commit: function () {
      STORAGE.set(_cache);
      return this;
    },
  };
};

export { createChunkRepository };
