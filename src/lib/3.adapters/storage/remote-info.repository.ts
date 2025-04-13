import type { RemoteInfo, RemoteName, Remotes } from "lib/1.domain";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import type { ForStoringRemoteInfo } from "lib/2.app/driving-ports/for-storing-remote-info.port";
import { Optional } from "../../utils/optional";

const createRemoteInfoRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringRemoteInfo => {
    const STORAGE: StorageEntry<Remotes> = toStorageEntry("remotes", {});
    const _cache: Remotes = STORAGE.get();

    return {
        contains: function (name: RemoteName) {
            return !!_cache[name];
        }, 
        addOrUpdate: function (remote: RemoteInfo) {
            _cache[remote.remoteName] = remote;
            return this;
        }, 
        tryGet: function (name: RemoteName) {
            return Optional.of(_cache[name])
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