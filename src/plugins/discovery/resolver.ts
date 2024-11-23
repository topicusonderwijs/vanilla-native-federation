import type { DiscoveryCache, CacheResolveOptions, DiscoveryMapper } from "./discovery.contract";
import { discoveryHandlerFactory } from "./discovery.handler";
import { noopMapper } from "./noop.mapper";
import { remoteModuleHandlerFactory } from "./remote-module.handler";
import { DEFAULT_CACHE } from "../../lib/cache";
import type { NativeFederationCache } from "../../lib/cache/cache.contract";
import { toCache } from "../../lib/cache/cache.handler";
import { globalCacheEntry } from "../../lib/cache/global-cache";
import { resolver as baseResolver, type Config, defaultConfig as baseConfig } from "../../lib/resolver";

type DiscoveryConfig = Config<NativeFederationCache & DiscoveryCache> & {
    resolveFromCache: CacheResolveOptions,
    discoveryMapper: DiscoveryMapper
};

const defaultConfig = (o: Partial<DiscoveryConfig>): DiscoveryConfig => {
    return {
        ...baseConfig(o),
        cache: o.cache ?? {
            ...DEFAULT_CACHE, 
            ...toCache({discovery: {}}, globalCacheEntry)
        },
        resolveFromCache: o.resolveFromCache ?? "all-latest",
        discoveryMapper: o.discoveryMapper ?? noopMapper
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
    const discoveryHandler = discoveryHandlerFactory(cacheHandler, cfg.discoveryMapper);
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