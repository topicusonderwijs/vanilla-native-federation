import type { RemoteModuleAdapter } from "./remote-module.adapter"
import type { InitFederationHandler } from "../../../lib/init-federation/init-federation.handler"
import type { LoadRemoteModule } from "../../../lib/remote-module/remote-module.contract"
import type { CacheResolveOptions, InitFederationFromDiscovery, RemoteModuleConfig } from "../discovery/discovery.contract"
import { NFDiscoveryError } from "../discovery/discovery.error"
import type { DiscoveryHandler } from "../discovery/discovery.handler"

type InitFederationAdapter = {
    init: InitFederationFromDiscovery
}

const initFederationAdapterFactory = (
    initFederationHandler: InitFederationHandler,
    discoveryHandler: DiscoveryHandler,
    remoteModuleAdapter: RemoteModuleAdapter,
): InitFederationAdapter => {

    const getEntryPointUrls = (remotes: RemoteModuleConfig): Record<string, string> => {    
        return Object.keys(remotes)
            .reduce((nfConfig, mfe) => {
                if(!remotes[mfe]) throw new NFDiscoveryError(`Could not preload remote '${mfe}', not available in discovery.`)
                return {
                    ...nfConfig, 
                    [mfe]: remotes[mfe].module.remoteEntry
                }
            }, {})
    }

    const verifyAndLoadModule = (load: LoadRemoteModule, remoteConfigs: RemoteModuleConfig) => {
        return (remote: string, version?: string): Promise<any> => {
            const remoteModule = remoteModuleAdapter.getIfInitialized(remoteConfigs, remote, version);
            return load(remoteModule); 
        }
    }

    const init = (
        discoveryManifestUrl: string,
        resolveFromCache: CacheResolveOptions,
     ) => {
        return discoveryHandler
            .fetchDiscoveredRemotes(discoveryManifestUrl, resolveFromCache)
            .then(remoteConfigs => {
                const entryPoints = getEntryPointUrls(remoteConfigs);

                return initFederationHandler.init(entryPoints)
                    .then(({load, importMap}) => ({
                        load: verifyAndLoadModule(load, remoteConfigs), 
                        importMap,
                        discovered: remoteConfigs
                    }))
            })
    }
    return {init};
}
export { initFederationAdapterFactory, InitFederationAdapter }