import { ConfigContract } from 'lib/2.app/config';
import { createMockLogHandler } from './handlers/log.handler';

export const mockConfig = (): ConfigContract => ({
  // StorageConfig
  storage: jest.fn().mockImplementation((_: string) => ({
    set: jest.fn().mockReturnThis(),
    get: jest.fn(),
    clear: jest.fn().mockReturnThis(),
  })),
  clearStorage: false,
  // LoggingConfig
  log: createMockLogHandler('debug'),
  sse: false,
  // importMapConfig
  setImportMapFn: jest.fn(),
  loadModuleFn: jest.fn(),
  // hostConfig
  hostRemoteEntry: false,
  // ModeConfig
  strict: {
    strictRemoteEntry: false,
    strictExternalCompatibility: false,
    strictExternalVersion: false,
    strictImportMap: false,
  },
  profile: {
    latestSharedExternal: false,
    overrideCachedRemotes: 'always',
    overrideCachedRemotesIfURLMatches: false,
  },
});
