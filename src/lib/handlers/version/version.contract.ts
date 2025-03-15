type Version = {
    version: string,
    requiredVersion?: string,
    strictRequiredVersion?: string,
    url: string
}

type VersionHandler = {
    isValid: (version: string) => boolean,
    compareVersions: (v1: string, v2: string) => number
    getLatestVersion: (v1: Version, v2?: Version) => Version
    isCompatible: (version: string, versionRange: string) => boolean,
    getSmallestVersionRange: (newRange: string, currentRange?: string) => string
}

export {VersionHandler, Version}
