import type { Remote } from "./../remote-info/remote-info.contract"

type SharedInfoHandler = {
    mapSharedDeps: (remoteInfo: Remote) => Record<string, string>,
    addSharedDepsToCache: (remoteInfo: Remote) => Remote
}

export { SharedInfoHandler }
export type { SharedInfo } from '@softarc/native-federation-runtime';
