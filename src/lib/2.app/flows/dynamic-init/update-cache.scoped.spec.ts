import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Version } from 'lib/1.domain/externals/version.contract';
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

    updateCache = createUpdateCache(config, adapters);
  });

  it('should add a scoped external', async () => {
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: false,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const actual = await updateCache(remoteEntry);

    expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledTimes(1);
    expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledWith('team/mfe1', 'dep-a', {
      tag: '1.2.3',
      file: 'dep-a.js',
    } as Version);

    expect(actual.actions).toEqual({});
  });

  it('should add the correct tag if missing', async () => {
    adapters.versionCheck.smallestVersion = jest.fn((): string => '1.2.1');

    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [],
      shared: [
        {
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: false,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const actual = await updateCache(remoteEntry);

    expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledTimes(1);
    expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledWith('team/mfe1', 'dep-a', {
      tag: '1.2.1',
      file: 'dep-a.js',
    } as Version);

    expect(actual.actions).toEqual({});
  });
});
