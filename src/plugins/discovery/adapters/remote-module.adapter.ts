import type { RemoteModule } from "../../../lib/remote-module/remote-module.contract";
import type { StorageHandler } from "../../../lib/storage/storage.handler";
import { getLatestVersion } from "../../../lib/utils/version";
import type { DiscoveryStorage, CachedRemoteVersions, RemoteModuleConfig } from "../discovery/discovery.contract";
import { NFDiscoveryError } from "../discovery/discovery.error";

type RemoteModuleAdapter = {
    getIfInitialized: (
        remoteConfigs: RemoteModuleConfig, 
        remoteName: string,
        version?: string
    ) => RemoteModule
}

const remoteModuleAdapterFactory = (
    cacheHandler: StorageHandler<DiscoveryStorage>,
): RemoteModuleAdapter => {
    const cache = cacheHandler.entry("discovery");

    const tryGetLatestCachedVersion = (cachedRemote?: CachedRemoteVersions): string|undefined => {
        return getLatestVersion(Object.keys(cachedRemote ?? {}));
    }

    const tryGetInitializedVersion = (remoteName: string, remoteConfigs: RemoteModuleConfig): string|undefined => {
        return remoteConfigs[remoteName]?.version;
    }

    const getIfInitialized = (remoteConfigs: RemoteModuleConfig, remoteName: string, version?: string): RemoteModule => {
        const cachedRemote = cache.get()[remoteName];
        if(!cachedRemote || Object.keys(cachedRemote).length < 1) throw new NFDiscoveryError(`Remote '${remoteName}' is not initialized.`);

        if(!version) version = tryGetInitializedVersion(remoteName, remoteConfigs) ?? tryGetLatestCachedVersion(cachedRemote);
        if(!version) throw new NFDiscoveryError(`Remote '${remoteName}' contains 0 initialized versions.`);

        const remote = cachedRemote[version]
        if(!remote) throw new NFDiscoveryError(`Version '${version}' from remote '${remoteName}' is not initialized.`);

        return remote.module; 
    }
    return { getIfInitialized };
}

export { remoteModuleAdapterFactory, RemoteModuleAdapter }