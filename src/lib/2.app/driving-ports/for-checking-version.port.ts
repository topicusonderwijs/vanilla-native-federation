

export type ForCheckingVersion = {
    isValidSemver:  (version: string) => boolean,
    isCompatible: (version: string, versionRange: string) => boolean,
    compare: (versionA: string, versionB: string) => number
}