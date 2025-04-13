import type { RemoteInfo, RemoteName, Remotes } from "lib/1.domain/remote/remote-info.contract";
import type { Optional } from "lib/utils/optional";

export type ForStoringRemoteInfo = {
    contains: (remoteName: RemoteName) => boolean,
    tryGet: (remoteName: RemoteName) => Optional<RemoteInfo>
    addOrUpdate: (remote: RemoteInfo) => void,
    getAll: () => Remotes, 
    commit: () => ForStoringRemoteInfo
}