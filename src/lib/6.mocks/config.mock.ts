import { ConfigContract } from 'lib/2.app/config';

export const mockConfig = (): ConfigContract => ({
  // StorageConfig
  storage: jest.fn().mockImplementation((_: string) => ({
    set: jest.fn().mockReturnThis(),
    get: jest.fn(),
    clear: jest.fn().mockReturnThis(),
  })),
  clearStorage: false,
  // LoggingConfig
  log: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    level: 'debug',
  },
  // importMapConfig
  importMapType: 'importmap',
  loadModuleFn: jest.fn(),
  // hostConfig
  hostRemoteEntry: false,
  // ModeConfig
  strict: false,
  profile: {
    latestSharedExternal: false,
    skipCachedRemotes: 'never',
    skipCachedRemotesIfURLMatches: true,
  },
});
