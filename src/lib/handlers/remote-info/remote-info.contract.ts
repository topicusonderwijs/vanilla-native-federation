import type { FederationInfo } from '@softarc/native-federation-runtime';

type RemoteInfoHandler = {
    addToStorage: (remote: Remote, remoteName?: string) => Remote,
    getFromCache: (remoteEntryUrl?: string, remoteName?: string) => Promise<Remote>,
    getFromEntry: (remoteEntryUrl: string) => Promise<Remote>
}

type Remote = FederationInfo & {baseUrl: string}

export {Remote, RemoteInfoHandler}

export type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';
