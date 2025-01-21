import type { FederationInfo } from '@softarc/native-federation-runtime';

type RemoteInfoHandler = {
    loadRemoteInfo: (remoteEntryUrl?: string, remoteName?: string) => Promise<Remote>
}

type Remote = FederationInfo & {baseUrl: string}

export {Remote, RemoteInfoHandler}

export type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';
