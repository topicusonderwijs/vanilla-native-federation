

export type VersionName = string;

export type Version = {
    version: VersionName,
    url: string
}

export type SharedVersionAction = 'skip'|'scope'|'share';

export type SharedVersion = Version & {
    requiredVersion: string,
    strictVersion: boolean,
    action: SharedVersionAction,
    cached?: boolean,
    host?: boolean
}