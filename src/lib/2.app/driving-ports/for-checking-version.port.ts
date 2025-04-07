

export type ForCheckingVersion = {
    isValidSemver:  (version: string) => boolean,
    isCompatible: (version: string, versionRange: string) => boolean,
}