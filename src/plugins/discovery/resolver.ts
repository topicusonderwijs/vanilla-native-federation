import type { DiscoveryCache, CacheResolveOptions } from "./discovery.contract";
import { discoveryHandlerFactory } from "./discovery.handler";
import { remoteModuleHandlerFactory } from "./remote-module.handler";
import { DEFAULT_CACHE } from "../../lib/cache";
import type { NativeFederationCache } from "../../lib/cache/cache.contract";
import { toCache } from "../../lib/cache/cache.handler";
import { globalCacheEntry } from "../../lib/cache/global-cache";
import { resolver as baseResolver, type Config } from "../../lib/resolver";

type DiscoveryConfig = Config<NativeFederationCache & DiscoveryCache> & {
    resolveFromCache: CacheResolveOptions
};

const defaultConfig = (o: Partial<DiscoveryConfig>): DiscoveryConfig => {
    return {
        cache: o.cache ?? {
            ...DEFAULT_CACHE, 
            ...toCache({discovery: {}}, globalCacheEntry)
        },
        resolveFromCache: "all-latest"
    }
}

const resolver = (
    cfg: DiscoveryConfig
) => {
    const { 
        cacheHandler,
        remoteInfoHandler, 
        domHandler,
        importMapHandler, 
    } = baseResolver(cfg);
    const discoveryHandler = discoveryHandlerFactory(cacheHandler);
    const remoteModuleHandler = remoteModuleHandlerFactory(cacheHandler);

    return {
        cacheHandler, 
        remoteInfoHandler, 
        importMapHandler, 
        domHandler,
        discoveryHandler,
        remoteModuleHandler,
    };
}

export { resolver, defaultConfig, DiscoveryConfig };