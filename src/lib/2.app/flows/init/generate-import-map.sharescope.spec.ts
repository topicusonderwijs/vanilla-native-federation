import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { GLOBAL_SCOPE, RemoteInfo, shareScope } from 'lib/1.domain';
import { NFError } from 'lib/native-federation.error';
import { Optional } from 'lib/utils/optional';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
  mockRemoteInfo_MFE3,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { mockExternal_A } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion_A } from 'lib/6.mocks/domain/externals/version.mock';
import {
  mockScopeUrl_MFE1,
  mockScopeUrl_MFE2,
  mockScopeUrl_MFE3,
} from 'lib/6.mocks/domain/scope-url.mock';

describe('createGenerateImportMap (shareScope-externals)', () => {
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
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({}));
    adapters.sharedExternalsRepo.getScopes = jest.fn(
      ({ includeGlobal } = { includeGlobal: true }) =>
        includeGlobal ? [GLOBAL_SCOPE, 'custom-scope'] : ['custom-scope']
    );
    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/mfe3') return Optional.of(mockRemoteInfo_MFE3({ exposes: [] }));
      if (remote === 'team/mfe2') return Optional.of(mockRemoteInfo_MFE2({ exposes: [] }));
      if (remote === 'team/mfe1') return Optional.of(mockRemoteInfo_MFE1({ exposes: [] }));

      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add the scoped externals to the right scope.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_2({ action: 'scope', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'scope', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
        },
      },
    });
  });

  it('should override the skipped externals to the right scope.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
      },
    });
  });

  it('should fallback to scope with the action skip and no shared externals.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_2({ action: 'scope', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
        },
      },
    });
  });

  it('should throw an error if no override version is available and strict.', async () => {
    config.strict = true;
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_2({ action: 'scope', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a] shareScope has no override version.'
    );
  });

  it('should not override a scoped version.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe3'] }),
                mockVersion_A.v2_1_2({ action: 'scope', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE3()]: {
          'dep-a': mockScopeUrl_MFE3({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE3({ file: 'dep-a.js' }),
        },
      },
    });
  });

  it('should mark the used versions as cached.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_3({
                  action: 'share',
                  remotes: { 'team/mfe3': { cached: false } },
                }),
                mockVersion_A.v2_1_2({
                  action: 'scope',
                  remotes: { 'team/mfe1': { cached: false } },
                }),
                mockVersion_A.v2_1_1({
                  action: 'skip',
                  remotes: { 'team/mfe2': { cached: false } },
                }),
              ],
            }),
          };
    });

    await generateImportMap();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_3({ action: 'share', remotes: { 'team/mfe3': { cached: true } } }),
          mockVersion_A.v2_1_2({ action: 'scope', remotes: { 'team/mfe1': { cached: true } } }),
          mockVersion_A.v2_1_1({ action: 'skip', remotes: { 'team/mfe2': { cached: false } } }),
        ],
      }),
      'custom-scope'
    );
  });

  it('should warn the user about 2 shared versions and choose the most recent one if in non-strict mode.', async () => {
    config.strict = false;

    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe3'] }),
                mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE3()]: {
          'dep-a': mockScopeUrl_MFE3({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE3({ file: 'dep-a.js' }),
        },
      },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      4,
      'ShareScope external custom-scope.dep-a has multiple shared versions.'
    );
  });

  it('should throw error if 2 shared versions and in strict mode when attempting an override.', async () => {
    config.strict = true;
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_3({ action: 'share', remotes: ['team/mfe3'] }),
                mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe2'] }),
              ],
            }),
          };
    });

    await expect(generateImportMap()).rejects.toEqual(new NFError('Could not create ImportMap.'));
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope.dep-a] ShareScope external has multiple shared versions.'
    );
  });

  it('should warn the user about 0 shared versions and scope all if in non-strict mode.', async () => {
    config.strict = false;

    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [mockVersion_A.v2_1_2({ action: 'skip', remotes: ['team/mfe1'] })],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
      },
    });
    expect(config.log.debug).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a] shareScope has no override version, scoping override versions.'
    );
  });

  it('should throw error if 0 shared versions and in strict mode.', async () => {
    config.strict = true;

    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [mockVersion_A.v2_1_2({ action: 'skip', remotes: ['team/mfe1'] })],
            }),
          };
    });

    await expect(generateImportMap()).rejects.toEqual(new NFError('Could not create ImportMap.'));
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a] shareScope has no override version.'
    );
  });

  it('should throw an error if the remote doesnt exist', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/mfe4'] })],
            }),
          };
    });

    await expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a][team/mfe4] Remote name not found in cache.'
    );
  });

  it('should use the first version of an entry from a shareScope to all scopes in the importMap.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/mfe1', 'team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
      },
    });
  });

  it('shoud add to all versions of skip version to the importMap.', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': mockExternal_A({
              dirty: false,
              versions: [
                mockVersion_A.v2_1_2({ action: 'share', remotes: ['team/mfe1'] }),
                mockVersion_A.v2_1_1({ action: 'skip', remotes: ['team/mfe3', 'team/mfe2'] }),
              ],
            }),
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
        [mockScopeUrl_MFE3()]: {
          'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
        },
      },
    });
  });
});
