import type { CacheOf } from "../../lib/cache/cache.contract";

type RemoteModuleMeta = {
    url: string;
    metadata: {integrity: string; version: string},
    deployment: {traffic: number, default: boolean},
    extras: Record<string, any> & {
        nativefederation: {
            remoteEntry: string,
            exposedModule: string
        }
    }
}

type CacheResolveOptions = Record<string,string|"latest">|"skip-cache"|"all-latest";

type Version = string;
type RemoteName = string;

type AvailableRemoteModules = Record<RemoteName, RemoteModuleMeta[]>;

type RemoteModuleConfigs = Record<string, RemoteModuleMeta>;

type CachedRemoteModuleConfigs = Record<RemoteName, Record<Version, RemoteModuleMeta>>;

type MfeDiscoveryManifest = {
    schema: string;
    microFrontends: AvailableRemoteModules;
}

type DiscoveryProps = { discovery: CachedRemoteModuleConfigs; }
type DiscoveryCache = CacheOf<DiscoveryProps>;

export {MfeDiscoveryManifest, CachedRemoteModuleConfigs, CacheResolveOptions, RemoteModuleConfigs, RemoteModuleMeta, AvailableRemoteModules, DiscoveryProps, DiscoveryCache}