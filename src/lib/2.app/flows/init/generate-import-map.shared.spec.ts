import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { NFError } from 'lib/native-federation.error';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteInfo_HOST,
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { mockExternal_A } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion_A } from 'lib/6.mocks/domain/externals/version.mock';
import {
  mockScopeUrl_HOST,
  mockScopeUrl_MFE1,
  mockScopeUrl_MFE2,
} from 'lib/6.mocks/domain/scope-url.mock';

describe('createGenerateImportMap (shared-externals)', () => {
  let generateImportMap: ForGeneratingImportMap;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo'
  >;
  let config: LoggingConfig & ModeConfig;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.getAll = jest.fn(() => ({}));
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({}));
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({}));
    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/host') return Optional.of(mockRemoteInfo_HOST({ exposes: [] }));
      if (remote === 'team/mfe1') return Optional.of(mockRemoteInfo_MFE1({ exposes: [] }));
      if (remote === 'team/mfe2') return Optional.of(mockRemoteInfo_MFE2({ exposes: [] }));

      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add the shared externals to the global scope.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [mockVersion_A.v2_1_1({ action: 'share', remotes: ['team/mfe1'] })],
      }),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
      },
    });
  });

  it('should only add the shared version of the shared external to the global scope.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'skip', remotes: ['team/mfe2'] }),
          mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/host'] }),
          mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe1'] }),
        ],
      }),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': mockScopeUrl_HOST({ file: 'dep-a.js' }),
      },
    });
  });

  it('should add the scoped version of the shared external to its own scope.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'skip', remotes: ['team/mfe2'] }),
          mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/host'] }),
          mockVersion_A.v2_1_1({ action: 'scope', remotes: ['team/mfe1'] }),
        ],
      }),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': mockScopeUrl_HOST({ file: 'dep-a.js' }),
      },
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
      },
    });
  });

  it('should should scope all remotes in a scoped version.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({
            action: 'scope',
            remotes: {
              'team/mfe1': { file: 'dep-a-mfe1.js' },
              'team/mfe2': { file: 'dep-a-mfe2.js' },
            },
          }),
        ],
      }),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a-mfe1.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE2({ file: 'dep-a-mfe2.js' }),
        },
      },
    });
  });

  it('should update the version in storage as "cached".', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe2'] }),
          mockVersion_A.v2_1_1({ action: 'scope', remotes: ['team/mfe1'] }),
        ],
      }),
    }));

    await generateImportMap();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'share', remotes: { 'team/mfe2': { cached: true } } }),
          mockVersion_A.v2_1_1({ action: 'scope', remotes: { 'team/mfe1': { cached: true } } }),
        ],
      })
    );
  });

  it('should warn the user about 2 shared versions and choose the most recent one if in non-strict mode.', async () => {
    config.strict = false;

    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe2'] }),
          mockVersion_A.v2_1_1({ action: 'share', remotes: ['team/mfe1'] }),
        ],
      }),
    }));
    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
      },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      4,
      'Singleton external dep-a has multiple shared versions.'
    );
  });

  it('should throw error if 2 shared versions and in strict mode.', async () => {
    config.strict = true;

    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe2'] }),
          mockVersion_A.v2_1_1({ action: 'share', remotes: ['team/mfe1'] }),
        ],
      }),
    }));

    await expect(generateImportMap()).rejects.toEqual(new NFError('Could not create ImportMap.'));
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      '[dep-a] Shared external has multiple shared versions.'
    );
  });

  it('should throw an error if the remote doesnt exist', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe3'] })],
      }),
    }));

    await expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      `[__GLOBAL__][dep-a][team/mfe3] Remote name not found in cache.`
    );
  });
});
