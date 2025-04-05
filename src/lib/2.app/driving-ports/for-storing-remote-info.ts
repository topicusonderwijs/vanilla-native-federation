import type { RemoteInfo, RemoteName } from "lib/1.domain/remote/remote-info.contract";

export type ForStoringRemoteInfo = {
    contains: (remoteName: RemoteName) => boolean,
    addOrUpdate: (remote: RemoteInfo) => void
}