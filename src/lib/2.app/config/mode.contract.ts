export type ModeProfileConfig = {
  latestSharedExternal: boolean;
  overrideCachedRemotes: 'always' | 'never' | 'init-only';
  overrideCachedRemotesIfURLMatches: boolean;
};

export type ModeStrictnessConfig = {
  strictRemoteEntry: boolean;
  strictExternalCompatibility: boolean;
  strictExternalVersion: boolean;
  strictImportMap: boolean;
};

export type ModeConfig = {
  strict: ModeStrictnessConfig;
  profile: ModeProfileConfig;
};

export type ModeOptions = {
  strict?: Partial<ModeStrictnessConfig> | boolean;
  profile?: Partial<ModeProfileConfig>;
};
