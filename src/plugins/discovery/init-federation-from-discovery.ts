import type { DiscoveryRemoteModuleHandler } from "./discovery-remote-module.handler"
import type { CacheResolveOptions, RemoteModuleConfig } from "./discovery.contract"
import { NFDiscoveryError } from "./discovery.error"
import type { DiscoveryHandler } from "./discovery.handler"
import { type DiscoveryConfig, resolver, defaultConfig } from "./resolver"
import type { ImportMap } from "../../lib/import-map/import-map.contract"
import { federationInitializerFactory, type FederationInitializer } from "../../lib/init-federation"
import type { LoadRemoteModule } from "../../lib/remote-module/remote-module.contract"

type InitFederationFromDiscovery = (
    discoveryManifestUrl: string,
    resolveFromCache: CacheResolveOptions,
) => Promise<{
    load: (remote: string, version?: string) => Promise<any>, 
    discovered: RemoteModuleConfig, 
    importMap: ImportMap
}>

type DiscoveryFederationInitializerFactory = {
    init: InitFederationFromDiscovery
}

const initFederationFromDiscoveryFactory = (
    federationInitializer: FederationInitializer,
    discoveryHandler: DiscoveryHandler,
    discoveryRemoteModuleHandler: DiscoveryRemoteModuleHandler,
): DiscoveryFederationInitializerFactory => {

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
            const remoteModule = discoveryRemoteModuleHandler.getIfInitialized(remoteConfigs, remote, version);
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

                return federationInitializer.init(entryPoints)
                    .then(({load, importMap}) => ({
                        load: verifyAndLoadModule(load, remoteConfigs), 
                        importMap,
                        discovered: remoteConfigs
                    }))
            })
    }
    return {init};
}

const initFederationFromDiscovery = (
    discoveryManifestUrl: string,
    options: Partial<DiscoveryConfig> = {}
) => {    
    const cfg = defaultConfig(options);
    
    const {
        remoteInfoHandler, 
        importMapHandler, 
        domHandler,
        discoveryHandler,
        remoteModuleHandler,
        discoveryRemoteModuleHandler
    } = resolver(cfg);

    const nfInitializer = initFederationFromDiscoveryFactory(
        federationInitializerFactory(
            domHandler,
            remoteInfoHandler, 
            importMapHandler, 
            remoteModuleHandler,
        ),
        discoveryHandler, 
        discoveryRemoteModuleHandler,
    );
    
    return nfInitializer.init(discoveryManifestUrl, cfg.resolveFromCache);
}

export { initFederationFromDiscovery};