import type { CacheOf } from "../cache/cache.contract";

type AvailableRemoteModule = {
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

type AvailableRemoteModules = Record<string, AvailableRemoteModule[]>;

type MfeDiscoveryManifest = {
    schema: string;
    microFrontends: AvailableRemoteModules;
}

type DiscoveryProps = { discovery: AvailableRemoteModules; }
type DiscoveryCache = CacheOf<DiscoveryProps>;

export {MfeDiscoveryManifest, AvailableRemoteModule, AvailableRemoteModules, DiscoveryProps, DiscoveryCache}