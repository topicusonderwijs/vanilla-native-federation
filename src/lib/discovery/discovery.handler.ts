import type { AvailableRemoteModules, DiscoveryProps, MfeDiscoveryManifest, RemoteModuleConfigs } from "./discovery.contract";
import type { CacheOf } from "../cache/cache.contract";
import type { TCacheHandler } from "../cache/cache.handler";
import { NativeFederationError } from "../native-federation-error";
import { compareVersions, toLatestVersions } from "../utils/version";

type TDiscoveryHandler = {
    fetchModuleConfigs: (discoveryManifestUrl: string, specificVersions: Record<string,string|"latest">|"fetch") => Promise<RemoteModuleConfigs>
}

const discoveryHandlerFactory = (
    cacheHandler: TCacheHandler<CacheOf<DiscoveryProps>>
): TDiscoveryHandler => {


    const getCachedRemoteVersions = (requested: Record<string,string|"latest">|"fetch"): RemoteModuleConfigs|false => {
        if (!cacheHandler.entry("discovery").exists()) return false;
        if (requested === "fetch") return false;

        const cache = cacheHandler.fetch("discovery");

        const cachedRemoteConfigs: RemoteModuleConfigs = {};

        if(Object.keys(requested).length < 0) requested = toLatestVersions(Object.keys(cache));
        for (const [remote, reqVersion] of Object.entries(requested)) {

            if(!cache[remote] || Object.keys(cache[remote]).length === 0) return false;

            const version = (reqVersion === "latest")
                ? Object.keys(cache[remote]).sort(compareVersions)[0]!
                : reqVersion;

            if(!cache[remote][version]) return false;
            cachedRemoteConfigs[remote] = cache[remote][version]!
        }

        return cachedRemoteConfigs;
    }

    const mapToRequestedVersion = (requested: Record<string,string|"latest">|"fetch") => (fetchedRemotes: AvailableRemoteModules): RemoteModuleConfigs => {
        if (requested === "fetch") requested = toLatestVersions(Object.keys(requested));

        return Object.entries(requested).reduce((acc,[remote, version]) => {
            if(!fetchedRemotes[remote] || fetchedRemotes[remote].length < 1) 
                throw new NativeFederationError(`Remote '${remote}' is not available in discovery.`);
            
            const config = (version === "latest" || version === "fetch")
                ? fetchedRemotes[remote][0]
                : fetchedRemotes[remote].find(v => v.metadata.version === version);

            if(!config) 
                throw new NativeFederationError(`Version '${version}' of remote '${remote}' is not available in discovery.`);

            return {...acc, [remote]: config};
        }, {} as RemoteModuleConfigs)
    }

    const updateCachedRemoteConfigs = (newRemoteConfigs: RemoteModuleConfigs) => {
        cacheHandler.mutate("discovery", cache => {
            Object.entries(newRemoteConfigs).forEach(([remote, cfg]) => {
                const version = cfg.metadata.version;
                if(!cache[remote]) cache[remote] = {};
                if(!cache[remote][version]) cache[remote][version] = cfg;
            })
            return cache;
        });
        return newRemoteConfigs;
    }


    const fetchModuleConfigs = (discoveryManifestUrl: string, requested: Record<string,string|"latest">|"fetch")
        : Promise<RemoteModuleConfigs> => {
            const cachedVersions = getCachedRemoteVersions(requested);
            if (cachedVersions) {
                return Promise.resolve(cachedVersions);
            }

            return fetch(discoveryManifestUrl)
                .then(r => r.json() as unknown as MfeDiscoveryManifest)
                .then(manifest => manifest.microFrontends)
                .then(mapToRequestedVersion(requested))
                .then(updateCachedRemoteConfigs);
        }
    return {fetchModuleConfigs};
}

export {discoveryHandlerFactory, TDiscoveryHandler}