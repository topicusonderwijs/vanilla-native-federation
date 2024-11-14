import type { DiscoveryCache, RemoteModuleConfigs } from "./discovery.contract"
import { NFDiscoveryError } from "./discovery.error"
import type { TDiscoveryHandler } from "./discovery.handler"
import type { TRemoteModuleHandler } from "./remote-module.handler"
import { resolver } from "./resolver"
import { DEFAULT_CACHE } from "../../lib/cache"
import type { NativeFederationCache } from "../../lib/cache/cache.contract"
import { toCache } from "../../lib/cache/cache.handler"
import { globalCacheEntry } from "../../lib/cache/global-cache"
import type { ImportMap } from "../../lib/import-map/import-map.contract"
import { federationInitializerFactory, type TFederationInitializer } from "../../lib/init-federation"
import type { TLoadRemoteModule } from "../../lib/load-remote-module"
import { toLatestVersions } from "../../lib/utils/version"

type TInitFederationWithDiscovery = (
    discoveryManifestUrl: string,
    remoteVersions: Record<string,string|"latest">|"fetch",
    initSpecificRemotes?: string[],
) => Promise<{
    load: (remote: string, version?: string) => Promise<any>, 
    discovery: RemoteModuleConfigs, 
    importMap: ImportMap
}>

type DiscoveryFederationInitializerFactory = {
    init: TInitFederationWithDiscovery
}

const initFederationWithDiscoveryFactory = (
    federationInitializer: TFederationInitializer,
    discoveryHandler: TDiscoveryHandler,
    remoteModuleHandler: TRemoteModuleHandler
): DiscoveryFederationInitializerFactory => {

    const getEntryPointUrls = (remotes: RemoteModuleConfigs, preloadRemotes?: string[]): Record<string, string> => {    
        if(!preloadRemotes) preloadRemotes = Object.keys(remotes);

        return preloadRemotes
            .reduce((nfConfig, mfe) => {
                if(!remotes[mfe]) throw new NFDiscoveryError(`Could not preload remote '${mfe}', not available in discovery.`)
                return {
                    ...nfConfig, 
                    [mfe]: remotes[mfe].extras.nativefederation.remoteEntry
                }
            }, {})
    }

    const verifyAndLoadModule = (load: TLoadRemoteModule, remoteConfigs: RemoteModuleConfigs) => {
        return (remote: string, version?: string): Promise<any> => {
            const remoteModule = remoteModuleHandler.getIfInitialized(remoteConfigs, remote, version);
            return load(remoteModule); 
        }
    }

    const init = (
        discoveryManifestUrl: string,
        remoteVersions: Record<string,string|"latest">|"fetch",
        initSpecificRemotes?: string[],
     ) => {    

        if(remoteVersions !== "fetch" && Object.keys(remoteVersions).length < 1 && !!initSpecificRemotes) {
            remoteVersions = toLatestVersions(initSpecificRemotes);
        }
        return discoveryHandler
            .fetchRemoteConfigs(discoveryManifestUrl, remoteVersions)
            .then(remoteConfigs => {
                const entryPoints = getEntryPointUrls(remoteConfigs, initSpecificRemotes);
                
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
    o: {
        initSpecificRemotes?: string[],
        remoteVersions?: Record<string,string|"latest">|"fetch",
        cache?: NativeFederationCache & DiscoveryCache
    }
) => {    
    const {
        remoteInfoHandler, 
        importMapHandler, 
        discoveryHandler,
        remoteModuleHandler
    } = resolver(o.cache ?? {...DEFAULT_CACHE, ...toCache({discovery: {}}, globalCacheEntry)});

    return initFederationWithDiscoveryFactory(
        federationInitializerFactory(remoteInfoHandler, importMapHandler), 
        discoveryHandler, 
        remoteModuleHandler
    ).init(discoveryManifestUrl, o.remoteVersions ?? {}, o.initSpecificRemotes);
}

export { initFederationWithDiscovery};