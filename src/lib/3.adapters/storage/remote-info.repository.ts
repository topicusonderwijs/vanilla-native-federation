import type { RemoteInfo, RemoteName, Remotes } from "lib/1.domain";
import type { StorageEntry, StorageEntryHandler } from "../../2.app/config/storage.contract";
import type { ForRemoteInfoStorage } from "lib/2.app/driving-ports/for-remote-info-storage.port";
import { Optional } from "../../utils/optional";

const createRemoteInfoRepository = (
    config: {storage: StorageEntryHandler},
): ForRemoteInfoStorage => {
    const STORAGE: StorageEntry<Remotes> = config.storage("remotes", {});
    const _cache: Remotes = STORAGE.get();

    return {
        contains: function (remoteName: RemoteName) {
            return !!_cache[remoteName];
        }, 
        addOrUpdate: function (remoteName: string, remote: RemoteInfo) {
            _cache[remoteName] = remote;
            return this;
        }, 
        tryGet: function (remoteName: RemoteName) {
            return Optional.of(_cache[remoteName])
        }, 
        tryGetModule: function (remoteName: RemoteName, exposedModule: string) {
            return Optional.of(_cache[remoteName]?.exposes.find(m => m.moduleName === exposedModule));
        },
        getAll: function () {
            return _cache;
        },
        commit: function () {
            STORAGE.set(_cache);
            return this;
        }
    };
}

export {createRemoteInfoRepository};