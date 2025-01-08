import type { ImportMap } from "../../../lib/import-map/import-map.contract";
import type { RemoteModule } from "../../../lib/remote-module/remote-module.contract";
import type { StorageOf } from "../../../lib/storage/storage.contract";

/**
 * Initialization
 */

type InitFederationFromDiscovery = (
    discoveryManifestUrl: string,
    resolveFromCache: CacheResolveOptions,
) => Promise<{
    load: (remote: string, version?: string) => Promise<any>, 
    discovered: RemoteModuleConfig, 
    importMap: ImportMap
}>

/**
 * Discovered remotes structure
 */
type Version = string;
type RemoteName = string;

type CachedRemoteModuleCfg = {
    url: string;
    version: string;
    module: RemoteModule
}

type CachedRemoteVersions = Record<Version, CachedRemoteModuleCfg>

type DiscoveredRemotes = Record<RemoteName, CachedRemoteVersions>

type RemoteModuleConfig = Record<RemoteName, CachedRemoteModuleCfg>


/**
 * Cache
 */
type CacheResolveOptions = Record<string,string|"latest">|"skip-cache"|"all-latest";

type DiscoveryCache = { discovery: DiscoveredRemotes; }
type DiscoveryStorage = StorageOf<DiscoveryCache>;

/**
 * Mapper
 */

type DiscoveryMapper<T = any, U extends DiscoveredRemotes = DiscoveredRemotes> = (input: T) => U;

export { InitFederationFromDiscovery, CacheResolveOptions, DiscoveryStorage, DiscoveredRemotes, CachedRemoteVersions, RemoteModuleConfig, CachedRemoteModuleCfg, DiscoveryMapper }