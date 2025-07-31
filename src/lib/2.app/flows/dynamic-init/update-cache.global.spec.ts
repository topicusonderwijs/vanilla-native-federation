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

    await expect(updateCache(remoteEntry)).rejects.toThrow(
      `Remote team/mfe1 is not compatible with team/mfe2.`
    );
    expect(config.log.error).toHaveBeenCalledWith(
      8,
      "[__GLOBAL__][team/mfe1] dep-a@1.2.3 Is not compatible with existing dep-a@2.2.3 requiredRange '~2.2.1'"
    );
  });

  it('should skip a shared external to list with same version', async () => {
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
                  name: 'team/mfe2',
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

    const result = await updateCache(remoteEntry);

    expect(result.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
  });

  it('should skip a version with a bad version', async () => {
    adapters.versionCheck.isValidSemver = jest.fn(() => false);

    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: 'bad-semver',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).not.toHaveBeenCalled();
    expect(config.log.warn).toHaveBeenCalledWith(
      8,
      "[team/mfe1][dep-a] Version 'bad-semver' is not a valid version, skipping version."
    );
  });
});
