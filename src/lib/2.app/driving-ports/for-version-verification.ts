

export type ForVersionVerification = {
    isValidSemver:  (version: string) => boolean,
    isCompatible: (version: string, versionRange: string) => boolean,
}