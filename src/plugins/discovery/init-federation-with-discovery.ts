import type { RemoteModuleConfigs, CacheResolveOptions } from "./discovery.contract"
import { NFDiscoveryError } from "./discovery.error"
import type { DiscoveryHandler } from "./discovery.handler"
import type { RemoteModuleHandler } from "./remote-module.handler"
import { type DiscoveryConfig, resolver, defaultConfig } from "./resolver"
import type { ImportMap } from "../../lib/import-map/import-map.contract"
import { federationInitializerFactory, type FederationInitializer } from "../../lib/init-federation"
import type { LoadRemoteModule } from "../../lib/load-remote-module"

type InitFederationWithDiscovery = (
    discoveryManifestUrl: string,
    resolveFromCache: CacheResolveOptions,
) => Promise<{
    load: (remote: string, version?: string) => Promise<any>, 
    discovery: RemoteModuleConfigs, 
    importMap: ImportMap
}>

type DiscoveryFederationInitializerFactory = {
    init: InitFederationWithDiscovery
}

const initFederationWithDiscoveryFactory = (
    discoveryHandler: DiscoveryHandler,
    remoteModuleHandler: RemoteModuleHandler,
    federationInitializer: FederationInitializer,
): DiscoveryFederationInitializerFactory => {

    const getEntryPointUrls = (remotes: RemoteModuleConfigs): Record<string, string> => {    
        return Object.keys(remotes)
            .reduce((nfConfig, mfe) => {
                if(!remotes[mfe]) throw new NFDiscoveryError(`Could not preload remote '${mfe}', not available in discovery.`)
                return {
                    ...nfConfig, 
                    [mfe]: remotes[mfe].extras.nativefederation.remoteEntry
                }
            }, {})
    }

    const verifyAndLoadModule = (load: LoadRemoteModule, remoteConfigs: RemoteModuleConfigs) => {
        return (remote: string, version?: string): Promise<any> => {
            const remoteModule = remoteModuleHandler.getIfInitialized(remoteConfigs, remote, version);
            return load(remoteModule); 
        }
    }

    const init = (
        discoveryManifestUrl: string,
        resolveFromCache: CacheResolveOptions,
     ) => {
        return discoveryHandler
            .fetchRemoteConfigs(discoveryManifestUrl, resolveFromCache)
            .then(remoteConfigs => {
                const entryPoints = getEntryPointUrls(remoteConfigs);
                
                return federationInitializer.init(entryPoints)
                    .then(({load, importMap}) => ({
                        load: verifyAndLoadModule(load, remoteConfigs), 
                        importMap,
                        discovery: remoteConfigs
                    }))
            })
    }
    return {init};
}

const initFederationWithDiscovery = (
    discoveryManifestUrl: string,
    options: Partial<DiscoveryConfig> = {}
) => {    
    const cfg = defaultConfig(options);
    const {
        remoteInfoHandler, 
        importMapHandler, 
        domHandler,
        discoveryHandler,
        remoteModuleHandler
    } = resolver(cfg);

    return initFederationWithDiscoveryFactory(
        discoveryHandler, 
        remoteModuleHandler,
        federationInitializerFactory(remoteInfoHandler, importMapHandler, domHandler), 
    ).init(discoveryManifestUrl, cfg.resolveFromCache);
}

export { initFederationWithDiscovery};