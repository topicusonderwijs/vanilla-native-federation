import { cachingProfile } from './caching.profile';
import { defaultProfile } from './default.profile';
import { createModeConfig } from './mode.config';

describe('config.mode', () => {
  it('should set balanced caching when default profile is chosen', () => {
    const config = createModeConfig({ profile: defaultProfile });
    expect(config.profile).toEqual({
      latestSharedExternal: false,
      overrideCachedRemotes: 'init-only',
      overrideCachedRemotesIfURLMatches: false,
    });
  });
  it('should set most optimal caching when caching profile is chosen', () => {
    const config = createModeConfig({ profile: cachingProfile });
    expect(config.profile).toEqual({
      latestSharedExternal: false,
      overrideCachedRemotes: 'never',
      overrideCachedRemotesIfURLMatches: false,
    });
  });

  it('should set the default profile when no profile is specified', () => {
    const config = createModeConfig({});
    expect(config.profile).toEqual(defaultProfile);
  });

  it('should set strict: false by default', () => {
    const config = createModeConfig({});
    expect(config.strict).toEqual({
      strictRemoteEntry: false,
      strictExternalCompatibility: false,
      strictExternalVersion: false,
      strictImportMap: false,
    });
  });
});
