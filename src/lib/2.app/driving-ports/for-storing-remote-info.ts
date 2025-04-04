import type { RemoteName } from "../../1.domain/remote-info.contract";

export type ForStoringRemoteInfo = {
    contains: (remoteName: RemoteName) => boolean
}