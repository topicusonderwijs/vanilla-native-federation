export type ModeProfileConfig = {
  latestSharedExternal: boolean;

  overrideCachedRemotes: 'always' | 'never' | 'init-only';
  overrideCachedRemotesIfURLMatches: boolean;
};
export type ModeConfig = {
  strict: boolean;
  profile: ModeProfileConfig;
};

export type ModeOptions = Partial<ModeConfig>;
