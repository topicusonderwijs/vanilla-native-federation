import type { ModeProfileConfig } from 'lib/2.app/config/mode.contract';

export const defaultProfile: ModeProfileConfig = {
  latestSharedExternal: false,
  overrideCachedRemotes: 'init-only',
  overrideCachedRemotesIfURLMatches: false,
};
