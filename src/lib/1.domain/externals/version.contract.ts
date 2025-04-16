

export type VersionName = string;

export type Version = {
    version: VersionName,
    url: string
}

export type SharedVersionAction = 'skip'|'scope'|'share';

export type SharedVersion = Version & {
    requiredVersion: string,
    strictVersion: boolean,
    cached: boolean,
    host: boolean,
    action: SharedVersionAction
}