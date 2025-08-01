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
    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'shareScope');

    updateCache = createUpdateCache(config, adapters);
  });

  it('should add an override external if shared compatible external exists', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);

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
                  file: 'dep-a-abc.js',
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
          strictVersion: true,
          shareScope: 'custom-scope',
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a-xyz.js',
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
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a-abc.js',
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
                file: 'dep-a-xyz.js',
                name: 'team/mfe1',
                requiredVersion: '~1.2.1',
                strictVersion: true,
                cached: false,
              },
            ],
          } as SharedVersion,
        ],
      },
      'custom-scope'
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'skip', override: 'http://my.service/mfe2/dep-a-abc.js' },
    });
  });

  it('should directly share a shareScope strict version', async () => {
    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'strict');

    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '1.2.3',
              host: false,
              action: 'share',
              remotes: [
                {
                  file: 'dep-a-abc.js',
                  name: 'team/mfe2',
                  requiredVersion: '1.2.3',
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
          version: '1.2.2',
          requiredVersion: '1.2.2',
          strictVersion: true,
          shareScope: 'strict',
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a-xyz.js',
        },
      ],
    };
    const actual = await updateCache(remoteEntry);
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a-abc.js',
                name: 'team/mfe2',
                requiredVersion: '1.2.3',
                strictVersion: false,
                cached: true,
              },
            ],
          } as SharedVersion,
          {
            tag: '1.2.2',
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a-xyz.js',
                name: 'team/mfe1',
                requiredVersion: '1.2.2',
                strictVersion: true,
                cached: true,
              },
            ],
          } as SharedVersion,
        ],
      },
      'strict'
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'share' },
    });
  });

  it('should override a shared external to list with same version when shareScope', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '1.2.3',
              host: false,
              action: 'share',
              remotes: [
                {
                  file: 'dep-a-abc.js',
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
          shareScope: 'custom-scope',
          outFileName: 'dep-a-xyz.js',
        },
      ],
    };

    const result = await updateCache(remoteEntry);

    expect(result.actions).toEqual({
      'dep-a': { action: 'skip', override: 'http://my.service/mfe2/dep-a-abc.js' },
    });
  });

  it('should add an scoped external if shared incompatible external exists', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of({
          dirty: false,
          versions: [
            {
              tag: '2.2.4',
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
          shareScope: 'custom-scope',
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
            tag: '2.2.4',
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
      'custom-scope'
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'scope' },
    });
  });

  it('should add a shared external if no shared version present.', async () => {
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
          shareScope: 'custom-scope',
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
            tag: '1.2.3',
            host: false,
            action: 'share',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: true,
              },
            ],
          } as SharedVersion,
        ],
      },
      'custom-scope'
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'share', override: undefined },
    });
  });
});
