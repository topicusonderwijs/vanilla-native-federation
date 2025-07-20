export type ModeProfileConfig = {
  latestSharedExternal: boolean;
  skipCachedRemotes: 'always' | 'never' | 'dynamic-only';
};
export type ModeConfig = {
  strict: boolean;
  profile: ModeProfileConfig;
};

export type ModeOptions = Partial<ModeConfig>;
