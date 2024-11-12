import type { DiscoveryProps, RemoteModuleConfigs, RemoteModuleMeta } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";
import type { CacheOf } from "../../lib/cache/cache.contract";
import type { TCacheHandler } from "../../lib/cache/cache.handler";
import type { RemoteModule } from "../../lib/load-remote-module";
import { getLatestVersion } from "../../lib/utils/version";

type TRemoteModuleHandler = {
    getIfInitialized: (
        remoteConfigs: RemoteModuleConfigs, 
        remoteName: string,
        version?: string
    ) => RemoteModule
}

const remoteModuleHandlerFactory = (
    cacheHandler: TCacheHandler<CacheOf<DiscoveryProps>>,
): TRemoteModuleHandler => {
    const cache = cacheHandler.entry("discovery");

    const tryGetLatestCachedVersion = (cachedRemote?: Record<string, RemoteModuleMeta>): string|undefined => {
        return getLatestVersion(Object.keys(cachedRemote ?? {}));
    }

    const tryGetInitializedVersion = (remoteName: string, remoteConfigs: RemoteModuleConfigs): string|undefined => {
        return remoteConfigs[remoteName]?.metadata.version;
    }

    const getIfInitialized = (remoteConfigs: RemoteModuleConfigs, remoteName: string, version?: string): RemoteModule => {
        const cachedRemote = cache.get()[remoteName];
        if(!cachedRemote || Object.keys(cachedRemote).length < 1) throw new NFDiscoveryError(`Remote '${remoteName}' is not initialized.`);

        if(!version) version = tryGetInitializedVersion(remoteName, remoteConfigs) ?? tryGetLatestCachedVersion(cachedRemote);
        if(!version) throw new NFDiscoveryError(`Remote '${remoteName}' contains 0 initialized versions.`);

        const remote = cachedRemote[version]
        if(!remote) throw new NFDiscoveryError(`Version '${version}' from remote '${remoteName}' is not initialized.`);

        return { 
            remoteName, 
            remoteEntry: remote.extras.nativefederation.remoteEntry,
            exposedModule: remote.extras.nativefederation.exposedModule
         };
        
    }
    return { getIfInitialized };
    
}

export { remoteModuleHandlerFactory, TRemoteModuleHandler }