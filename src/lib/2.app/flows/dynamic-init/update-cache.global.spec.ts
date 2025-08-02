import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { SharedVersion } from 'lib/1.domain/externals/version.contract';
import { Optional } from 'lib/utils/optional';
import { ForUpdatingCache } from 'lib/2.app/driver-ports/dynamic-init/for-updating-cache';
import { createUpdateCache } from './update-cache';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { RemoteInfo, SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createProcessDynamicRemoteEntry - scoped', () => {
  let updateCache: ForUpdatingCache;
  let config: LoggingConfig & ModeConfig;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.versionCheck.isValidSemver = jest.fn(() => true);
    adapters.versionCheck.compare = jest.fn(() => 0);

    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/mfe1')
        return Optional.of({ scopeUrl: 'http://my.service/mfe1/', exposes: [] });
      if (remote === 'team/mfe2')
        return Optional.of({ scopeUrl: 'http://my.service/mfe2/', exposes: [] });

      return Optional.empty<RemoteInfo>();
    });
    adapters.sharedExternalsRepo.tryGet = jest.fn(_e => Optional.empty<SharedExternal>());
    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'global');

    updateCache = createUpdateCache(config, adapters);
  });

  it('should add a shared external to empty list', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn((): Optional<SharedExternal> => Optional.empty());

    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: share because no version exists in cache
    // cached: true because this will be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
            remotes: [
              {
                name: 'team/mfe1',
                file: 'dep-a.js',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],

            host: false,
            action: 'share',
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'share', override: undefined },
    });
  });

  it('should add a shared external to list with compatible version', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '1.2.4',
              host: false,
              action: 'share',
              remotes: [
                {
                  file: 'dep-a.js',
                  name: 'team/mfe2',
                  requiredVersion: '~1.2.1',
                  strictVersion: false,
                  cached: true,
                },
              ],
            },
          ],
        })
    );
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: skip because a compatible version already exists in cache
    // cached: false because this will not be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.4',
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
          } as SharedVersion,
          {
            tag: '1.2.3',
            host: false,
            action: 'skip',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
  });

  it('should add and skip shared external to list with incompatible version and not strictVersion', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '2.2.3',
              host: false,
              action: 'share',
              remotes: [
                {
                  file: 'dep-a.js',
                  name: 'team/mfe2',
                  requiredVersion: '~2.2.1',
                  strictVersion: false,
                  cached: true,
                },
              ],
            },
          ],
        })
    );
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: scope because an incompatible version already exists in cache
    // cached: false because this will not be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '2.2.3',
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~2.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
          } as SharedVersion,
          {
            tag: '1.2.3',
            host: false,
            action: 'skip',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
  });

  it('should add and scope shared external to list with incompatible version and strictVersion', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '2.2.3',
              host: false,
              action: 'share',
              remotes: [
                {
                  file: 'dep-a.js',
                  name: 'team/mfe2',
                  requiredVersion: '~2.2.1',
                  strictVersion: false,
                  cached: true,
                },
              ],
            },
          ],
        })
    );
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: true,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: scope because an incompatible version already exists in cache
    // cached: true because this will be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '2.2.3',
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~2.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
          } as SharedVersion,
          {
            tag: '1.2.3',
            host: false,
            action: 'scope',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~1.2.1',
                strictVersion: true,
                cached: true,
              },
            ],
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'scope', override: undefined },
    });
  });

  it('should throw an error when shared externalwith incompatible version and strictVersion and strict', async () => {
    config.strict = true;

    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '2.2.3',
              remotes: [
                {
                  file: 'dep-a.js',
                  name: 'team/mfe2',
                  requiredVersion: '~2.2.1',
                  strictVersion: false,
                  cached: true,
                },
              ],

              host: false,
              action: 'share',
            },
          ],
        })
    );
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: true,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    await expect(updateCache(remoteEntry)).rejects.toThrow(`Could not process remote 'team/mfe1'`);
    expect(config.log.error).toHaveBeenCalledWith(
      8,
      "[__GLOBAL__][team/mfe1] dep-a@1.2.3 Is not compatible with existing dep-a@2.2.3 requiredRange '~2.2.1'"
    );
  });

  it('should handle duplicate versions of the same external', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
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
          ],
        })
    );

    const remoteEntry = {
      name: 'team/mfe2',
      url: 'http://my.service/mfe2/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const result = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
            remotes: [
              {
                name: 'team/mfe1',
                file: 'dep-a.js',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
              {
                name: 'team/mfe2',
                file: 'dep-a.js',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],

            host: false,
            action: 'share',
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(result.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
  });

  it('should warn users if the requiredVersions differ and strictVersion', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
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
          ],
        })
    );

    const remoteEntry = {
      name: 'team/mfe2',
      url: 'http://my.service/mfe2/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.2',
          strictVersion: true,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const result = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
            remotes: [
              {
                name: 'team/mfe1',
                file: 'dep-a.js',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
              {
                name: 'team/mfe2',
                file: 'dep-a.js',
                requiredVersion: '~1.2.2',
                strictVersion: true,
                cached: false,
              },
            ],

            host: false,
            action: 'share',
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(result.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      8,
      "[team/mfe2][dep-a@1.2.3] Required version '~1.2.2' does not match existing '~1.2.1'"
    );
  });

  it('should throw an error if the requiredVersions differs if strictVersion and in strict mode', async () => {
    config.strict = true;
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
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
          ],
        })
    );

    const remoteEntry = {
      name: 'team/mfe2',
      url: 'http://my.service/mfe2/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.2',
          strictVersion: true,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    await expect(updateCache(remoteEntry)).rejects.toThrow("Could not process remote 'team/mfe2'");

    expect(config.log.error).toHaveBeenCalledWith(
      8,
      "[team/mfe2][dep-a@1.2.3] Required version '~1.2.2' does not match existing '~1.2.1'"
    );
  });

  it('should add the correct tag if missing', async () => {
    adapters.versionCheck.smallestVersion = jest.fn((): string => '1.2.1');

    adapters.sharedExternalsRepo.tryGet = jest.fn((): Optional<SharedExternal> => Optional.empty());

    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.1',
            remotes: [
              {
                name: 'team/mfe1',
                file: 'dep-a.js',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],

            host: false,
            action: 'share',
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'share', override: undefined },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      8,
      "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
    );
  });

  it('should correctly order the the versions descending', async () => {
    adapters.versionCheck.compare = jest.fn((a, b) => {
      const order = ['1.2.4', '1.2.3', '1.2.2'];
      return order.indexOf(b) - order.indexOf(a);
    });
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '1.2.4',
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
                  cached: true,
                },
              ],
              host: false,
              action: 'skip',
            },
          ],
        })
    );

    const remoteEntry = {
      name: 'team/mfe3',
      url: 'http://my.service/mfe3/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.4',
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
          } as SharedVersion,
          {
            tag: '1.2.3',
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
            action: 'skip',
          } as SharedVersion,
          {
            tag: '1.2.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
            host: false,
            action: 'skip',
          } as SharedVersion,
        ],
      },
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'skip', override: undefined },
    });
  });
});
