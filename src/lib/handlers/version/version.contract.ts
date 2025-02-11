type Version = {
    version: string,
    requiredVersion?: [string,string],
    strictRequiredVersion?: [string,string],
    url: string
}

type VersionHandler = {
    compareVersions: (v1: string, v2: string) => number
    getLatestVersion: (v1: Version, v2?: Version) => Version
    isCompatible: (version: string, requiredVersion: [string, string]) => boolean,
    toRange: (version: string) => [string,string],
    stripVersionRange: (version: string) => string
}

export {VersionHandler, Version}