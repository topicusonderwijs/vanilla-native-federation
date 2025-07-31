import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { mockScopedExternalsRepository } from 'lib/6.mocks/adapters/scoped-externals.repository.mock';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { GLOBAL_SCOPE, RemoteInfo, shareScope } from 'lib/1.domain';
import { NFError } from 'lib/native-federation.error';
import { Optional } from 'lib/utils/optional';

describe('createGenerateImportMap (shareScope-externals)', () => {
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
        skipCachedRemotesIfURLMatches: true,
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
    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({}));
    mockAdapters.sharedExternalsRepo.getScopes = jest.fn(
      ({ includeGlobal } = { includeGlobal: true }) =>
        includeGlobal ? [GLOBAL_SCOPE, 'custom-scope'] : ['custom-scope']
    );
    mockAdapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/mfe1')
        return Optional.of({ scopeUrl: 'http://my.service/mfe1/', exposes: [] });
      if (remote === 'team/mfe2')
        return Optional.of({ scopeUrl: 'http://my.service/mfe2/', exposes: [] });
      if (remote === 'team/mfe3')
        return Optional.of({ scopeUrl: 'http://my.service/mfe3/', exposes: [] });

      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(mockConfig, mockAdapters);
  });

  it('should add the scoped externals to the right scope.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'scope',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'scope',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe2/dep-a.js',
        },
      },
    });
  });

  it('should fallback to scope with the action skip and no shared externals.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: false,
                  action: 'scope',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'skip',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe2/dep-a.js',
        },
      },
    });
  });

  it('should override the skipped externals to the right scope.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a-abc.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'share',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a-xyz.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'skip',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
      },
    });
  });

  it('should scope a shared version if no override version is available.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'skip',
                },
              ],
            },
          };
    });
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

  it('should throw an error if no override version is available and strict.', async () => {
    mockConfig.strict = true;
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'skip',
                },
              ],
            },
          };
    });

    expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(mockConfig.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a] shareScope has no override version.'
    );
  });

  it('should not override a scoped version.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'share',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: true,
                  action: 'skip',
                },
                {
                  tag: '1.2.1',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe3',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'scope',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe3/': {
          'dep-a': 'http://my.service/mfe3/dep-a.js',
        },
      },
    });
  });

  it('should mark the used versions as cached.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'share',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: true,
                  action: 'skip',
                },
                {
                  tag: '1.2.1',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe3',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'scope',
                },
              ],
            },
          };
    });

    await generateImportMap();

    expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
            host: false,
            action: 'share',
          },
          {
            tag: '1.2.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: true,
            action: 'skip',
          },
          {
            tag: '1.2.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe3',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
            host: false,
            action: 'scope',
          },
        ],
      },
      'custom-scope'
    );
  });

  it('should warn the user about 2 shared versions and choose the most recent one if in non-strict mode.', async () => {
    mockConfig.strict = false;

    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],

                  host: false,
                  action: 'share',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'share',
                },
                {
                  tag: '1.2.1',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe3',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'skip',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe2/dep-a.js',
        },
        'http://my.service/mfe3/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
      },
    });
    expect(mockConfig.log.warn).toHaveBeenCalledWith(
      4,
      'ShareScope external custom-scope.dep-a has multiple shared versions.'
    );
  });

  it('should throw error if 2 shared versions and in strict mode when attempting an override.', async () => {
    mockConfig.strict = true;

    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: false,
                  action: 'share',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'share',
                },
                {
                  tag: '1.2.1',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe3',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'skip',
                },
              ],
            },
          };
    });

    await expect(generateImportMap()).rejects.toEqual(new NFError('Could not create ImportMap.'));
    expect(mockConfig.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope.dep-a] ShareScope external has multiple shared versions.'
    );
  });

  it('should warn the user about 0 shared versions and scope all if in non-strict mode.', async () => {
    mockConfig.strict = false;

    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: false,
                  action: 'skip',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: true,
                  action: 'skip',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe2/dep-a.js',
        },
      },
    });
    expect(mockConfig.log.debug).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a] shareScope has no override version, scoping override versions.'
    );
  });

  it('should throw an error if the remote doesnt exist', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe4',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: false,
            action: 'share',
          },
        ],
      },
    }));

    await expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(mockConfig.log.error).toHaveBeenCalledWith(
      4,
      '[custom-scope][dep-a][team/mfe4] Remote name not found in cache.'
    );
  });

  it('shoud add a usedBy entry from a shared version to the importMap.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a-abc.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: true,
                    },
                    {
                      file: 'dep-a-def.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: false,
                  action: 'share',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
      },
    });
  });

  it('shoud add a usedBy entry from override version to the importMap.', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn((scope?: string): shareScope => {
      return !scope || scope === GLOBAL_SCOPE
        ? {}
        : {
            'dep-a': {
              dirty: false,
              versions: [
                {
                  tag: '1.2.3',
                  remotes: [
                    {
                      file: 'dep-a-abc.js',
                      name: 'team/mfe1',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: true,
                    },
                    {
                      file: 'dep-a-def.js',
                      name: 'team/mfe3',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: false,
                  action: 'share',
                },
                {
                  tag: '1.2.2',
                  remotes: [
                    {
                      file: 'dep-a.js',
                      name: 'team/mfe2',
                      requiredVersion: '~1.2.1',
                      strictVersion: false,
                      cached: false,
                    },
                  ],
                  host: false,
                  action: 'skip',
                },
              ],
            },
          };
    });

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
        'http://my.service/mfe3/': {
          'dep-a': 'http://my.service/mfe1/dep-a-abc.js',
        },
      },
    });
  });
});
