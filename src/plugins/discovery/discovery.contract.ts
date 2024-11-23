import type { CacheOf } from "../../lib/cache";

/**
 * Discovered remotes structure
 */
type Version = string;
type RemoteName = string;

type CachedRemoteModuleCfg = {
    url: string;
    version: string;
    nativefederation: {
        remoteEntry: string;
        exposedModule: string;
    }
}

type CachedRemoteVersions = Record<Version, CachedRemoteModuleCfg>

type DiscoveredRemotes = Record<RemoteName, CachedRemoteVersions>

type RemoteModuleConfig = Record<RemoteName, CachedRemoteModuleCfg>


/**
 * Cache
 */

type CacheResolveOptions = Record<string,string|"latest">|"skip-cache"|"all-latest";

type DiscoveryProps = { discovery: DiscoveredRemotes; }
type DiscoveryCache = CacheOf<DiscoveryProps>;

/**
 * Mapper
 */

type DiscoveryMapper<T = any, U extends DiscoveredRemotes = DiscoveredRemotes> = (input: T) => U;

export { CacheResolveOptions, DiscoveryCache, DiscoveredRemotes, CachedRemoteVersions, RemoteModuleConfig, CachedRemoteModuleCfg, DiscoveryMapper }