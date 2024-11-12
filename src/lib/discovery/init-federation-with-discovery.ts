import { toCache } from "../cache/cache.handler"
import { federationInitializerFactory, type TFederationInitializer } from "../init-federation"
import type { DiscoveryCache, RemoteModuleConfigs } from "./discovery.contract"
import { DEFAULT_CACHE } from "../cache"
import type { NativeFederationCache } from "../cache/cache.contract"
import { globalCacheEntry } from "../cache/global-cache"
import type { ImportMap } from "../import-map/import-map.contract"
import type { TLoadRemoteModule } from "../load-remote-module"
import type { TDiscoveryHandler } from "./discovery.handler"
import { NativeFederationError } from "../native-federation-error"
import { discoveryResolver } from "../resolver"
import { toLatestVersions } from "../utils/version"


type TInitFederationWithDiscovery = (
    discoveryManifestUrl: string,
    remoteVersions: Record<string,string|"latest">|"fetch",
    initSpecificRemotes?: string[],
) => Promise<{load: TLoadRemoteModule, discovery: RemoteModuleConfigs, importMap: ImportMap}>

type DiscoveryFederationInitializerFactory = {
    init: TInitFederationWithDiscovery
}

const initFederationWithDiscoveryFactory = (
    federationInitializer: TFederationInitializer,
    discoveryHandler: TDiscoveryHandler,
): DiscoveryFederationInitializerFactory => {


    const getEntryPointUrls = (remotes: RemoteModuleConfigs, preloadRemotes?: string[]): Record<string, string> => {    
        if(!preloadRemotes) preloadRemotes = Object.keys(remotes);

        return preloadRemotes
            .reduce((nfConfig, mfe) => {
                if(!remotes[mfe]) throw new NativeFederationError(`Could not preload remote '${mfe}', not available in discovery.`)
                return {
                    ...nfConfig, 
                    [mfe]: remotes[mfe].extras.nativefederation.remoteEntry
                }
            }, {})
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
            .fetchModuleConfigs(discoveryManifestUrl, remoteVersions)
            .then(remotes => {
                const entryPoints = getEntryPointUrls(remotes, initSpecificRemotes);
                return federationInitializer.init(entryPoints)
                    .then(federationProps => ({
                        ...federationProps, 
                        discovery: remotes
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
): Promise<{load: TLoadRemoteModule, discovery: RemoteModuleConfigs, importMap: ImportMap}> => {    
    if (!o.cache) o.cache = {...DEFAULT_CACHE, ...toCache({discovery: {}}, globalCacheEntry)}
    const {
        remoteInfoHandler, 
        importMapHandler, 
        discoveryHandler
    } = discoveryResolver(o.cache);

    const nfInitializer = federationInitializerFactory(remoteInfoHandler, importMapHandler);
    return initFederationWithDiscoveryFactory(nfInitializer, discoveryHandler)
        .init(discoveryManifestUrl, o.remoteVersions ?? {}, o.initSpecificRemotes);
}

export { initFederationWithDiscovery};