

export type ModeConfig = {
    strict: boolean,
    profile: { 
        latestSharedExternal: boolean,
        skipCachedRemotes: boolean
    }
}

export type ModeOptions = Partial<ModeConfig>