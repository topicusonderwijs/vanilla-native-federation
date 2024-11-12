import type { CacheOf } from "../cache/cache.contract";

type RemoteModuleMeta = {
    url: string;
    metadata: {integrity: string; version: string},
    deployment: {traffic: number, default: boolean},
    extras: Record<string, any> & {
        nativefederation: {
            remoteEntry: string,
            key: string
        }
    }
}

type version = string;
type remoteName = string;

type AvailableRemoteModules = Record<remoteName, RemoteModuleMeta[]>;

type RemoteModuleConfigs = Record<string, RemoteModuleMeta>;

type CachedRemoteModuleConfigs = Record<remoteName, Record<version, RemoteModuleMeta>>;

type MfeDiscoveryManifest = {
    schema: string;
    microFrontends: AvailableRemoteModules;
}

type DiscoveryProps = { discovery: CachedRemoteModuleConfigs; }
type DiscoveryCache = CacheOf<DiscoveryProps>;

export {MfeDiscoveryManifest, CachedRemoteModuleConfigs, RemoteModuleConfigs, RemoteModuleMeta, AvailableRemoteModules, DiscoveryProps, DiscoveryCache}