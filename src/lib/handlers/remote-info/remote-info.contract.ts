import type { FederationInfo } from '@softarc/native-federation-runtime';

type RemoteInfoHandler = {
    addToCache: (remote: Remote, remoteName?: string) => Remote,
    get: (remoteEntryUrl?: string, remoteName?: string) => Promise<Remote>
}

type Remote = FederationInfo & {baseUrl: string}

export {Remote, RemoteInfoHandler}

export type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';
