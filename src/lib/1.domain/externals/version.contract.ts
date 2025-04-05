

export type VersionName = string;

export type Version = {
    version: VersionName,
    url: string
}

export type SharedVersion = Version & {
    requiredVersion: string,
    strictVersion: boolean,
    action: 'skip'|'scope'|'share'
}