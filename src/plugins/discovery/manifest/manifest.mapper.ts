import type { DiscoveredRemotes, DiscoveryMapper, CachedRemoteVersions, CachedRemoteModuleCfg } from "../discovery.contract";
import type { DiscoveryManifest, ManifestMicroFrontends, ManifestRemoteModule } from "./discovery-manifest.contract";

type ManifestMapper = DiscoveryMapper<DiscoveryManifest>;

const manifestMapper: ManifestMapper = (manifest: DiscoveryManifest) => {
    const mapRemoteModule = (remote: string, module: ManifestRemoteModule) 
        : CachedRemoteModuleCfg => ({
            url: module.url,
            version: module.metadata.version,
            module: {
                remoteName: remote,
                remoteEntry: module.extras.nativefederation.remoteEntry,
                exposedModule: module.extras.nativefederation.exposedModule,
            }
        })

    const mapVersion = (remote: string, modules: ManifestRemoteModule[])
        : CachedRemoteVersions => 
            modules.reduce((acc, module) => ({
                ...acc, 
                [module.metadata.version]: mapRemoteModule(remote, module)
            }), {})

    const mapRemotes = (mfe: ManifestMicroFrontends)
        : DiscoveredRemotes => 
            Object.entries(mfe)
                .reduce((acc, [remote, cfg]) => ({
                    ...acc, 
                    [remote]: mapVersion(remote, cfg)
                }), {})

    return mapRemotes(manifest.microFrontends)
}

export {ManifestMapper, manifestMapper};
