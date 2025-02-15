import type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';

import type { RemoteModule } from '../remote-module/remote-module.contract';

type RemoteName = string;

type RemoteEntry = string;

type RemoteInfo = {
    remoteName: string
    scopeUrl: string
    exposes: RemoteModule[] 
}

type RemoteInfoHandler = {
    toStorage: (remote: {name: string; exposes: ExposesInfo[]}, baseUrl: string) => RemoteInfo,
    inStorage: (remoteName: string) => boolean,
    fromStorage: (remoteName: string) => RemoteInfo,
    fetchRemoteEntry: (remoteEntryUrl: string) => Promise<FederationInfo>,
    toScope: (remoteEntry: RemoteEntry) => string
}

export {RemoteInfo, RemoteName, RemoteEntry, RemoteInfoHandler}

export type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';
