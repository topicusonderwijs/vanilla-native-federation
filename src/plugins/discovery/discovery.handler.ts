import type { CacheResolveOptions, DiscoveredRemotes, DiscoveryCache, DiscoveryMapper, RemoteModuleConfig } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";
import type { CacheHandler } from "../../lib/cache/cache.handler";
import { getLatestVersion, addLatestTag, getLatestVersionBefore } from "../../lib/utils/version";

type DiscoveryHandler = {
    fetchDiscoveredRemotes: (
        discoveryManifestUrl: string, 
        resolveFromCache: CacheResolveOptions
    ) => Promise<RemoteModuleConfig>
}

const discoveryHandlerFactory = (
    cacheHandler: CacheHandler<DiscoveryCache>,
    mapper: DiscoveryMapper
): DiscoveryHandler => {

    const getCachedRemoteVersions = (resolveFromCache: CacheResolveOptions): RemoteModuleConfig|false => {
        if (resolveFromCache === "skip-cache") return false;
        if (!cacheHandler.entry("discovery").exists()) return false;

        const cache = cacheHandler.fetch("discovery");

        const cachedRemoteConfigs: RemoteModuleConfig = {};

        if(resolveFromCache === "all-latest") resolveFromCache = addLatestTag(Object.keys(cache));

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

    const mapToRequestedVersion = (resolveVersions: Exclude<CacheResolveOptions, "from-cache">) => 
        (fetchedRemotes: DiscoveredRemotes): RemoteModuleConfig => {
        if(resolveVersions === "all-latest" || Object.keys(resolveVersions).length < 1) {
            resolveVersions = addLatestTag(Object.keys(fetchedRemotes));
        }

        return Object.entries(resolveVersions).reduce((acc,[remote, version]) => {
            if (!fetchedRemotes[remote] || typeof fetchedRemotes[remote] !== 'object') 
                throw new NFDiscoveryError(`Remote '${remote}' is not available in discovery.`);

            if (version === "latest") version = getLatestVersion(Object.keys(fetchedRemotes[remote]))!


            if(!fetchedRemotes[remote][version]) {
                console.warn(`Version '${version}' of remote '${remote}' is not available in discovery.`);
                const fallbackVersion = getLatestVersionBefore(Object.keys(fetchedRemotes[remote]), version);
                if (!fallbackVersion) {
                    throw new NFDiscoveryError(`Remote '${remote}' has no versions available before '${version}' in discovery.`);
                }

                console.warn("Falling back to " + fallbackVersion);
                version = fallbackVersion;
            }

            return {...acc, [remote]: fetchedRemotes[remote][version]!};
        }, {} as RemoteModuleConfig)
    }

    const updateCachedRemoteConfigs = (newRemoteConfigs: RemoteModuleConfig) => {
        cacheHandler.mutate("discovery", cache => {
            Object.entries(newRemoteConfigs).forEach(([remote, cfg]) => {
                if(!cache[remote]) cache[remote] = {};
                if(!cache[remote][cfg.version]) cache[remote][cfg.version] = cfg;
            })
            return cache;
        });
        return newRemoteConfigs;
    }


    const fetchDiscoveredRemotes = (discoveryManifestUrl: string, resolveFromCache: CacheResolveOptions)
        : Promise<RemoteModuleConfig> => {
            const cachedVersions = getCachedRemoteVersions(resolveFromCache);
            if (cachedVersions) return Promise.resolve(cachedVersions);

            if(resolveFromCache === "all-latest") resolveFromCache = {};
            return fetch(discoveryManifestUrl)
                .then(response => mapper(response.json()))
                .then(mapToRequestedVersion(resolveFromCache))
                .then(updateCachedRemoteConfigs);
        }
    return {fetchDiscoveredRemotes};
}

export {discoveryHandlerFactory, DiscoveryHandler}