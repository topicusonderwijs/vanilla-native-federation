import { type DiscoveryConfig, resolver, defaultConfig } from "./resolver"

const initFederationFromDiscovery = (
    discoveryManifestUrl: string,
    options: Partial<DiscoveryConfig> = {}
) => {    
    const cfg = defaultConfig(options);
    const { initFederationAdapter } = resolver(cfg);
    
    return initFederationAdapter.init(discoveryManifestUrl, cfg.resolveFromCache);
}

export { initFederationFromDiscovery};