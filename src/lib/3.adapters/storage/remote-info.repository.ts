import { RemoteInfo } from "lib/1.domain";
import type { StorageEntry } from "./storage.contract";
import type { StorageConfig } from "./storage.contract";
import { ForStoringRemoteInfo } from "lib/2.app/driving-ports/for-storing-remote-info";

const createRemoteInfoRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringRemoteInfo => {
    const STORAGE: StorageEntry<Record<string, RemoteInfo>> = toStorageEntry("remotes", {});

    function contains(key: string)
        : boolean {
            return !!STORAGE.get()[key];
        };

    return {contains};
}

export {createRemoteInfoRepository};