type ManifestRemoteModule = {
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

type ManifestMicroFrontends = Record<string, ManifestRemoteModule[]>;

type DiscoveryManifest = {
    schema: string;
    microFrontends: ManifestMicroFrontends;
}

export {DiscoveryManifest, ManifestMicroFrontends, ManifestRemoteModule }