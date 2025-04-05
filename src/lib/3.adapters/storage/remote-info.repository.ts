import type { RemoteInfo, RemoteName } from "lib/1.domain";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import type { ForStoringRemoteInfo } from "lib/2.app/driving-ports/for-storing-remote-info.port";
import { Optional } from "../../utils/optional";

const createRemoteInfoRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringRemoteInfo => {
    const STORAGE: StorageEntry<Record<string, RemoteInfo>> = toStorageEntry("remotes", {});

    function get(name: RemoteName)
        : RemoteInfo|undefined {
            return (STORAGE.get() ?? {})[name];
        };

    function contains(name: RemoteName)
        : boolean {
            return !!get(name);
        };

    function addOrUpdate(remote: RemoteInfo)
        : void {
            STORAGE.set({
                ...STORAGE.get() ?? {},
                [remote.remoteName]: remote
            })
            
        }

    function tryGet(name: RemoteName) 
        : Optional<RemoteInfo> {
            return Optional.of(get(name))
        }


    return {contains, addOrUpdate, tryGet};
}

export {createRemoteInfoRepository};