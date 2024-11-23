import { initFederationAdapterFactory } from "./adapters/init-federation.adapter";
import { remoteModuleAdapterFactory } from "./adapters/remote-module.adapter";
import type { DiscoveryCache, CacheResolveOptions, DiscoveryMapper } from "./discovery/discovery.contract";
import { discoveryHandlerFactory } from "./discovery/discovery.handler";
import { noopMapper } from "./mapper/noop.mapper";
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
    const base = baseResolver(cfg);

    const discoveryHandler = discoveryHandlerFactory(base.cacheHandler, base.logHandler, cfg.discoveryMapper);

    const remoteModuleAdapter = remoteModuleAdapterFactory(base.cacheHandler);
    const initFederationAdapter = initFederationAdapterFactory(base.initFederationHandler, discoveryHandler, remoteModuleAdapter)

    return {
        ...base,
        discoveryHandler, 
        remoteModuleAdapter,
        initFederationAdapter
    };
}

export { resolver, defaultConfig, DiscoveryConfig };