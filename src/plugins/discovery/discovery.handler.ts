import type { AvailableRemoteModules, DiscoveryProps, MfeDiscoveryManifest, RemoteModuleConfigs, CacheResolveOptions, RemoteModuleMeta } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";
import type { CacheOf } from "../../lib/cache/cache.contract";
import type { CacheHandler } from "../../lib/cache/cache.handler";
import { getLatestVersion, addLatestTag, getLatestVersionBefore } from "../../lib/utils/version";

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

    const mapToRequestedVersion = (resolveVersions: Exclude<CacheResolveOptions, "from-cache">) => (fetchedRemotes: AvailableRemoteModules): RemoteModuleConfigs => {
        if(resolveVersions === "all-latest" || Object.keys(resolveVersions).length < 1) {
            resolveVersions = addLatestTag(Object.keys(fetchedRemotes));
        }

        return Object.entries(resolveVersions).reduce((acc,[remote, version]) => {
            if(!fetchedRemotes[remote] || fetchedRemotes[remote].length < 1) 
                throw new NFDiscoveryError(`Remote '${remote}' is not available in discovery.`);
            
            const versions = Object.values(fetchedRemotes[remote])
                .reduce(
                    (acc,m) => ({...acc, [m.metadata.version]: m}), 
                    {} as Record<string, RemoteModuleMeta>
                );

            if (version === "latest") version = getLatestVersion(Object.keys(versions))!

            if(!versions[version]) {
                console.warn(`Version '${version}' of remote '${remote}' is not available in discovery.`);
                const fallbackVersion = getLatestVersionBefore(Object.keys(versions), version);
                if (!fallbackVersion) {
                    throw new NFDiscoveryError(`Remote '${remote}' has no versions available before '${version}' in discovery.`);
                }

                console.warn("Falling back to " + fallbackVersion);
                version = fallbackVersion;
            }

            return {...acc, [remote]: versions[version]!};
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