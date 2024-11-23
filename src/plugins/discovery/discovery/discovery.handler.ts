import type { CacheResolveOptions, DiscoveredRemotes, DiscoveryCache, DiscoveryMapper, RemoteModuleConfig } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";
import type { CacheHandler } from "../../../lib/cache/cache.handler";
import type { LogHandler } from "../../../lib/logging/log.handler";
import { getLatestVersion, addLatestTag, getLatestVersionBefore } from "../../../lib/utils/version";

type DiscoveryHandler = {
    fetchDiscoveredRemotes: (
        discoveryManifestUrl: string, 
        resolveFromCache: CacheResolveOptions
    ) => Promise<RemoteModuleConfig>
}

const discoveryHandlerFactory = (
    cacheHandler: CacheHandler<DiscoveryCache>,
    logger: LogHandler,
    mapper: DiscoveryMapper
): DiscoveryHandler => {

    const getCachedRemoteVersions = (resolveFromCache: CacheResolveOptions): RemoteModuleConfig|false => {
        if (resolveFromCache === "skip-cache") {
            logger.debug("[discovery] Skipping cached module configs");
            return false;
        }
        if (!cacheHandler.entry("discovery").exists()){
            logger.debug("[discovery] Discovery cache not found.");
            return false;
        } 

        const cache = cacheHandler.fetch("discovery");

        const cachedRemoteConfigs: RemoteModuleConfig = {};

        if(resolveFromCache === "all-latest"){
            logger.debug(`[discovery] Adding 'latest' tag to cached remotes: ["${Object.keys(cache).join('", "')}"]`);
            resolveFromCache = addLatestTag(Object.keys(cache));
        } 

        for (const [remote, reqVersion] of Object.entries(resolveFromCache)) {

            if(!cache[remote] || Object.keys(cache[remote]).length === 0) {
                logger.warn(`[discovery] Remote ${remote} does not exist in cache. Omitting cache`);
                return false;
            }

            const version = (reqVersion === "latest")
                ? getLatestVersion(Object.keys(cache[remote]))!
                : reqVersion;

            if(!cache[remote][version]){
                logger.warn(`[discovery] Version ${version} of ${remote} does not exist in cache. Omitting cache`);
                return false;
            }
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
                logger.warn(`[discovery] Version '${version}' of remote '${remote}' is not available in discovery.`)

                const fallbackVersion = getLatestVersionBefore(Object.keys(fetchedRemotes[remote]), version);
                if (!fallbackVersion) {
                    throw new NFDiscoveryError(`Remote '${remote}' has no versions available before '${version}' in discovery.`);
                }

                logger.warn(`[discovery] Remote ${remote} is falling back to version ${fallbackVersion}`)
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

    const handleError = (msg: string) => (e: any) => {
        logger.error(`${msg}: ${e?.message ?? e}`)
        throw new NFDiscoveryError("[discovery] Could not load remote module configs")
    }

    const fetchDiscoveredRemotes = (discoveryManifestUrl: string, resolveFromCache: CacheResolveOptions)
        : Promise<RemoteModuleConfig> => {
            const cachedVersions = getCachedRemoteVersions(resolveFromCache);
            if (cachedVersions) {
                logger.debug("[discovery] Retrieved remote configs from cache.");

                return Promise.resolve(cachedVersions);
            }

            logger.debug(`[discovery] Fetching discovery from ${discoveryManifestUrl}`);

            if(resolveFromCache === "all-latest") resolveFromCache = {};
            return fetch(discoveryManifestUrl)
                .catch(handleError("Fetching manifest failed"))
                .then(response => mapper(response.json()))
                .then(mapToRequestedVersion(resolveFromCache))
                .catch(handleError("Mapping manifest failed"))
                .then(updateCachedRemoteConfigs)
                .catch(handleError("Could not update cache"))
        }
    return {fetchDiscoveredRemotes};
}

export {discoveryHandlerFactory, DiscoveryHandler}