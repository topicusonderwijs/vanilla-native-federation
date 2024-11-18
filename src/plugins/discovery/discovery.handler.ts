import type { AvailableRemoteModules, DiscoveryProps, MfeDiscoveryManifest, RemoteModuleConfigs, CacheResolveOptions } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";
import type { CacheOf } from "../../lib/cache/cache.contract";
import type { CacheHandler } from "../../lib/cache/cache.handler";
import { getLatestVersion, toLatestVersions } from "../../lib/utils/version";

type DiscoveryHandler = {
    fetchRemoteConfigs: (discoveryManifestUrl: string, resolveFromCache: CacheResolveOptions) => Promise<RemoteModuleConfigs>
}

const discoveryHandlerFactory = (
    cacheHandler: CacheHandler<CacheOf<DiscoveryProps>>
): DiscoveryHandler => {

    const getCachedRemoteVersions = (resolveFromCache: CacheResolveOptions): RemoteModuleConfigs|false => {
        if (resolveFromCache === "skip-cache") return false;
        if (!cacheHandler.entry("discovery").exists()) return false;

        const cache = cacheHandler.fetch("discovery");

        const cachedRemoteConfigs: RemoteModuleConfigs = {};

        if(resolveFromCache === "all-latest") resolveFromCache = toLatestVersions(Object.keys(cache));
        for (const [remote, reqVersion] of Object.entries(resolveFromCache)) {

            if(!cache[remote] || Object.keys(cache[remote]).length === 0) return false;

            const version = (reqVersion === "latest")
                ? getLatestVersion(Object.keys(cache[remote]))!
                : reqVersion;

            if(!cache[remote][version]) return false;
            cachedRemoteConfigs[remote] = cache[remote][version]!
        }

        return cachedRemoteConfigs;
    }

    const mapToRequestedVersion = (resolveFromCache: Exclude<CacheResolveOptions, "from-cache">) => (fetchedRemotes: AvailableRemoteModules): RemoteModuleConfigs => {
        if(resolveFromCache === "all-latest" || Object.keys(resolveFromCache).length < 1) {
            resolveFromCache = toLatestVersions(Object.keys(fetchedRemotes));
        }

        return Object.entries(resolveFromCache).reduce((acc,[remote, version]) => {
            if(!fetchedRemotes[remote] || fetchedRemotes[remote].length < 1) 
                throw new NFDiscoveryError(`Remote '${remote}' is not available in discovery.`);
            
            const config = (version === "latest")
                ? fetchedRemotes[remote][0]
                : fetchedRemotes[remote].find(v => v.metadata.version === version);

            if(!config) 
                throw new NFDiscoveryError(`Version '${version}' of remote '${remote}' is not available in discovery.`);

            return {...acc, [remote]: config};
        }, {} as RemoteModuleConfigs)
    }

    const updateCachedRemoteConfigs = (newRemoteConfigs: RemoteModuleConfigs) => {
        cacheHandler.mutate("discovery", cache => {
            Object.entries(newRemoteConfigs).forEach(([remote, cfg]) => {
                const version = cfg.metadata.version;
                if(!cache[remote]) cache[remote] = {};
                if(!cache[remote][version]) cache[remote][version] = cfg;
            })
            return cache;
        });
        return newRemoteConfigs;
    }


    const fetchRemoteConfigs = (discoveryManifestUrl: string, resolveFromCache: CacheResolveOptions)
        : Promise<RemoteModuleConfigs> => {
            const cachedVersions = getCachedRemoteVersions(resolveFromCache);
            if (cachedVersions) return Promise.resolve(cachedVersions);
                  
            if(resolveFromCache === "all-latest") resolveFromCache = {};
            return fetch(discoveryManifestUrl)
                .then(r => r.json() as unknown as MfeDiscoveryManifest)
                .then(manifest => manifest.microFrontends)
                .then(mapToRequestedVersion(resolveFromCache))
                .then(updateCachedRemoteConfigs);
        }
    return {fetchRemoteConfigs};
}

export {discoveryHandlerFactory, DiscoveryHandler}