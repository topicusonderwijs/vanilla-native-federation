import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { mockScopedExternalsRepository } from 'lib/6.mocks/adapters/scoped-externals.repository.mock';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';

describe('createGenerateImportMap (scoped-externals)', () => {
  let generateImportMap: ForGeneratingImportMap;
  let mockAdapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo'
  >;
  let mockConfig: LoggingConfig & ModeConfig;

  beforeEach(() => {
    mockConfig = {
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        level: 'debug',
      },
      strict: false,
      profile: {
        latestSharedExternal: false,
        skipCachedRemotes: 'never',
      },
    } as LoggingConfig & ModeConfig;

    mockAdapters = {
      remoteInfoRepo: mockRemoteInfoRepository(),
      scopedExternalsRepo: mockScopedExternalsRepository(),
      sharedExternalsRepo: mockSharedExternalsRepository(),
    };

    mockAdapters.remoteInfoRepo.getAll = jest.fn(() => ({}));
    mockAdapters.scopedExternalsRepo.getAll = jest.fn(() => ({}));
    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({}));

    generateImportMap = createGenerateImportMap(mockConfig, mockAdapters);
  });

  it('should add a scoped externals to its respective scope.', async () => {
    mockAdapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'http://my.service/mfe1/': {
        'dep-a': {
          version: '1.2.3',
          file: 'dep-a.js',
        },
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
      },
    });
  });

  it('should handle multiple scopes.', async () => {
    mockAdapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'http://my.service/mfe1/': {
        'dep-a': {
          version: '1.2.3',
          file: 'dep-a.js',
        },
      },
      'http://my.service/mfe2/': {
        'dep-b': {
          version: '1.2.3',
          file: 'dep-b.js',
        },
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-b': 'http://my.service/mfe2/dep-b.js',
        },
      },
    });
  });

  it('should handle multiple externals in 1 scope.', async () => {
    mockAdapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'http://my.service/mfe1/': {
        'dep-a': {
          version: '1.2.3',
          file: 'dep-a.js',
        },
        'dep-b': {
          version: '1.2.3',
          file: 'dep-b.js',
        },
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
          'dep-b': 'http://my.service/mfe1/dep-b.js',
        },
      },
    });
  });
});
