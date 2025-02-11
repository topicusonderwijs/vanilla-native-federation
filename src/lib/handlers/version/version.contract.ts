type Version = {
    version: string,
    requiredVersion?: string,
    strictRequiredVersion?: string,
    url: string
}

type VersionHandler = {
    compareVersions: (v1: string, v2: string) => number
    getLatestVersion: (v1: Version, v2?: Version) => Version
    isCompatible: (version: string, requiredVersion: string) => boolean,
    stripVersionRange: (version: string) => string
}

export {VersionHandler, Version}