import { ForGeneratingImportMap } from '../driver-ports/for-generating-import-map';
import { DrivingContract } from '../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { mockScopedExternalsRepository } from 'lib/6.mocks/adapters/scoped-externals.repository.mock';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { LoggingConfig } from '../config/log.contract';
import { ModeConfig } from '../config/mode.contract';

describe('createGenerateImportMap (remoteInfos)', () => {
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
        skipCachedRemotes: false,
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

  it('should add the remote modules to the global scope.', async () => {
    mockAdapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [
          { moduleName: './wc-comp-a', file: 'component-a.js' },
          { moduleName: './wc-comp-b', file: 'component-b.js' },
        ],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe1/./wc-comp-a': 'http://my.service/mfe1/component-a.js',
        'team/mfe1/./wc-comp-b': 'http://my.service/mfe1/component-b.js',
      },
    });
  });

  it('should add multiple remotes.', async () => {
    mockAdapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [
          { moduleName: './wc-comp-a', file: 'component-a.js' },
          { moduleName: './wc-comp-b', file: 'component-b.js' },
        ],
      },
      'team/mfe2': {
        scopeUrl: 'http://my.service/mfe2/',
        exposes: [{ moduleName: './wc-comp-c', file: 'component-c.js' }],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe1/./wc-comp-a': 'http://my.service/mfe1/component-a.js',
        'team/mfe1/./wc-comp-b': 'http://my.service/mfe1/component-b.js',
        'team/mfe2/./wc-comp-c': 'http://my.service/mfe2/component-c.js',
      },
    });
  });

  it('should handle remotes without modules.', async () => {
    mockAdapters.remoteInfoRepo.getAll = jest.fn(() => ({
      '__NF-HOST__': {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [],
      },
      'team/mfe2': {
        scopeUrl: 'http://my.service/mfe2/',
        exposes: [{ moduleName: './wc-comp-c', file: 'component-c.js' }],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe2/./wc-comp-c': 'http://my.service/mfe2/component-c.js',
      },
    });
  });
});
