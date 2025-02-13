import type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';

type RemoteName = string;

type RemoteEntry = string;

type RemoteModule = {
    moduleName: string, 
    url: string
}

type RemoteInfo = {
    remoteName: string
    scopeUrl: string
    exposes: RemoteModule[] 
}


type RemoteInfoHandler = {
    toStorage: (remote: {name: string; exposes: ExposesInfo[]}, baseUrl: string) => RemoteInfo,
    inStorage: (remoteName: string) => boolean,
    fromStorage: ((remoteName: string) => RemoteInfo) & ((remoteName: string, exposedModule: string) => RemoteModule),
    fetchRemoteEntry: (remoteEntryUrl: string) => Promise<FederationInfo>,
    toScope: (remoteEntry: RemoteEntry) => string
}

export {RemoteInfo, RemoteModule, RemoteName, RemoteEntry, RemoteInfoHandler}

export type { ExposesInfo, FederationInfo } from '@softarc/native-federation-runtime';
