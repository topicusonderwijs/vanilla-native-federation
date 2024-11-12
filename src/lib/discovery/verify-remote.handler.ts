import type { CacheOf } from "../cache/cache.contract";
import type { TCacheHandler } from "../cache/cache.handler";
import type { RemoteModule } from "../load-remote-module";
import type { DiscoveryProps, RemoteModuleConfigs } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";
import { getLatestVersion } from "../utils/version";

type TVerifyRemoteHandler = {
    verifyModule: (
        loadedRemotes: RemoteModuleConfigs, 
        remoteName: string,
        version?: string
    ) => RemoteModule
}

const verifyRemoteHandlerFactory = (
    cacheHandler: TCacheHandler<CacheOf<DiscoveryProps>>,
): TVerifyRemoteHandler => {
    const cache = cacheHandler.fetch("discovery");

    const getLoadedOrLatestCachedVersion = (loadedRemotes: RemoteModuleConfigs, remoteName: string) => {
        return loadedRemotes[remoteName]?.metadata.version ?? getLatestVersion(Object.keys(cache[remoteName] ?? {}))!;
    }

    const verifyModule = (loadedRemotes: RemoteModuleConfigs, remoteName: string, version?: string): RemoteModule => {
        if(!cache[remoteName] || Object.keys(cache[remoteName]).length < 1) throw new NFDiscoveryError(`Remote '${remoteName}' is not initialized.`);

        if(!version) version = getLoadedOrLatestCachedVersion(loadedRemotes, remoteName);

        const remote = cache[remoteName][version]
        if(!remote) throw new NFDiscoveryError(`Version '${version}' from remote '${remoteName}' is not initialized.`);

        return { 
            remoteName, 
            remoteEntry: remote.extras.nativefederation.remoteEntry,
            exposedModule: remote.extras.nativefederation.exposedModule
         };
        
    }
    return { verifyModule };
    
}

export { verifyRemoteHandlerFactory, TVerifyRemoteHandler }