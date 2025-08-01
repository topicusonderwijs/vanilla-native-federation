import type { RemoteInfo, RemoteName, Remotes } from 'lib/1.domain';
import type { StorageConfig, StorageEntry } from 'lib/2.app/config/storage.contract';
import type { ForRemoteInfoStorage } from 'lib/2.app/driving-ports/for-remote-info-storage.port';
import * as _path from 'lib/utils/path';
import { Optional } from 'lib/utils/optional';

const createRemoteInfoRepository = (config: StorageConfig): ForRemoteInfoStorage => {
  const STORAGE: StorageEntry<Remotes> = config.storage('remotes', {});
  if (config.clearStorage) STORAGE.clear();

  const _cache: Remotes = STORAGE.get() ?? {};

  return {
    contains: function (remoteName: RemoteName) {
      return !!_cache[remoteName];
    },
    remove: function (remoteName: RemoteName) {
      delete _cache[remoteName];
      return this;
    },
    addOrUpdate: function (remoteName: string, remote: RemoteInfo) {
      _cache[remoteName] = remote;
      return this;
    },
    tryGet: function (remoteName: RemoteName) {
      return Optional.of(_cache[remoteName]);
    },
    tryGetModule: function (remoteName: RemoteName, exposedModule: string) {
      return Optional.of(_cache[remoteName]?.exposes.find(m => m.moduleName === exposedModule)).map(
        m => _path.join(_cache[remoteName]!.scopeUrl, m.file)
      );
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

export { createRemoteInfoRepository };
