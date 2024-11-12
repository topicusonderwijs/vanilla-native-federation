import { toCache } from "../cache/cache.handler"
import { federationInitializerFactory, type TFederationInitializer } from "../init-federation"
import type { DiscoveryCache, RemoteModuleConfigs } from "./discovery.contract"
import { DEFAULT_CACHE } from "../cache"
import type { TVerifyRemoteHandler } from "./verify-remote.handler"
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
    verifyRemoteHandler: TVerifyRemoteHandler
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

    const verifyAndLoadModule = (load: TLoadRemoteModule, discovery: RemoteModuleConfigs) => {
        return (remote: string, version?: string): Promise<any> => {
            const remoteModule = verifyRemoteHandler.verifyModule(discovery, remote, version);
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
            .then(remotes => {
                const entryPoints = getEntryPointUrls(remotes, initSpecificRemotes);
                return federationInitializer.init(entryPoints)
                    .then(({load, importMap}) => ({
                        load: verifyAndLoadModule(load, remotes), 
                        importMap,
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
) => {    
    if (!o.cache) o.cache = {...DEFAULT_CACHE, ...toCache({discovery: {}}, globalCacheEntry)}
    const {
        remoteInfoHandler, 
        importMapHandler, 
        discoveryHandler,
        verifyRemoteHandler
    } = discoveryResolver(o.cache);

    return initFederationWithDiscoveryFactory(
        federationInitializerFactory(remoteInfoHandler, importMapHandler), 
        discoveryHandler, 
        verifyRemoteHandler
    ).init(discoveryManifestUrl, o.remoteVersions ?? {}, o.initSpecificRemotes);
}

export { initFederationWithDiscovery};