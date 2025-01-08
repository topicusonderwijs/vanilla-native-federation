import { initFederationAdapterFactory } from "./adapters/init-federation.adapter";
import { remoteModuleAdapterFactory } from "./adapters/remote-module.adapter";
import type { DiscoveryStorage, CacheResolveOptions, DiscoveryMapper } from "./discovery/discovery.contract";
import { discoveryHandlerFactory } from "./discovery/discovery.handler";
import { noopMapper } from "./mapper/noop.mapper";
import { resolver as baseResolver, type Config, defaultConfig as baseConfig } from "../../lib/resolver";
import { DEFAULT_STORAGE } from "../../lib/storage/default-storage";
import { globalThisStorageEntry } from "../../lib/storage/global-this-storage";
import type { NfStorage } from "../../lib/storage/storage.contract";
import { toStorage } from "../../lib/storage/storage.handler";

type DiscoveryConfig = Config<NfStorage & DiscoveryStorage> & {
    resolveFromCache: CacheResolveOptions,
    discoveryMapper: DiscoveryMapper
};

const defaultConfig = (o: Partial<DiscoveryConfig>): DiscoveryConfig => {
    return {
        ...baseConfig(o),
        cache: o.cache ?? {
            ...DEFAULT_STORAGE, 
            ...toStorage({discovery: {}}, globalThisStorageEntry)
        },
        resolveFromCache: o.resolveFromCache ?? "all-latest",
        discoveryMapper: o.discoveryMapper ?? noopMapper
    }
}

const resolver = (
    cfg: DiscoveryConfig
) => {
    const base = baseResolver(cfg);

    const discoveryHandler = discoveryHandlerFactory(base.storageHandler, base.logHandler, cfg.discoveryMapper);

    const remoteModuleAdapter = remoteModuleAdapterFactory(base.storageHandler);
    const initFederationAdapter = initFederationAdapterFactory(base.initFederationHandler, discoveryHandler, remoteModuleAdapter)

    return {
        ...base,
        discoveryHandler, 
        remoteModuleAdapter,
        initFederationAdapter
    };
}

export { resolver, defaultConfig, DiscoveryConfig };