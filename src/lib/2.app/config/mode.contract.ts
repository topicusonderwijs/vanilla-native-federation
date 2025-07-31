export type ModeProfileConfig = {
  latestSharedExternal: boolean;
  skipCachedRemotes: 'always' | 'never' | 'dynamic-only';
  skipCachedRemotesIfURLMatches: boolean;
};
export type ModeConfig = {
  strict: boolean;
  profile: ModeProfileConfig;
};

export type ModeOptions = Partial<ModeConfig>;
