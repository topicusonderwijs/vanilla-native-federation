

export type VersionName = string;

export type Version = {
    version: VersionName,
    requiredVersion?: string,
    url: string
}

export type SharedVersion = Version & {
    strictVersion: boolean
    type: 'skip'|'scope'|'share',
}