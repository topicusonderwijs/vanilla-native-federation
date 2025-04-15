import type { RemoteModule } from "lib/1.domain";
import type { RemoteInfo, RemoteName, Remotes } from "lib/1.domain/remote/remote-info.contract";
import type { Optional } from "lib/utils/optional";

export type ForStoringRemoteInfo = {
    contains: (remoteName: RemoteName) => boolean,
    tryGet: (remoteName: RemoteName) => Optional<RemoteInfo>,
    tryGetModule: (remoteName: RemoteName, exposedModule: string) => Optional<RemoteModule>,
    addOrUpdate: (remote: RemoteInfo) => ForStoringRemoteInfo,
    getAll: () => Remotes, 
    commit: () => ForStoringRemoteInfo
}