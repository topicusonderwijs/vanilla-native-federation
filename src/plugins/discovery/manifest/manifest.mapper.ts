import type { DiscoveredRemotes, DiscoveryMapper, CachedRemoteVersions, CachedRemoteModuleCfg } from "../discovery.contract";
import type { DiscoveryManifest, ManifestMicroFrontends, ManifestRemoteModule } from "./discovery-manifest.contract";

type ManifestMapper = DiscoveryMapper<DiscoveryManifest>;

const manifestMapper: ManifestMapper = (manifest: DiscoveryManifest) => {
    const mapRemoteModule = (m: ManifestRemoteModule) 
        : CachedRemoteModuleCfg => ({
            url: m.url,
            version: m.metadata.version,
            nativefederation: {
                remoteEntry: m.extras.nativefederation.remoteEntry,
                exposedModule: m.extras.nativefederation.exposedModule,
            }
        })

    const mapVersion = (modules: ManifestRemoteModule[])
        : CachedRemoteVersions => 
            modules.reduce((acc, m) => ({
                ...acc, 
                [m.metadata.version]: mapRemoteModule(m)
            }), {})

    const mapRemotes = (mfe: ManifestMicroFrontends)
        : DiscoveredRemotes => 
            Object.entries(mfe)
                .reduce((acc, [remote, cfg]) => ({
                    ...acc, 
                    [remote]: mapVersion(cfg)
                }), {})

    return mapRemotes(manifest.microFrontends)
}

export {ManifestMapper, manifestMapper};
