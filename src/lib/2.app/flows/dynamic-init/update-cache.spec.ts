import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Optional } from 'lib/utils/optional';
import { ForUpdatingCache } from 'lib/2.app/driver-ports/dynamic-init/for-updating-cache';
import { createUpdateCache } from './update-cache';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { RemoteInfo, SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createProcessDynamicRemoteEntry', () => {
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

  describe('cleaning up before processing', () => {
    it('should remove the previous cached version if remoteEntry is marked as override', async () => {
      const remoteEntry = {
        name: 'team/mfe1',
        url: 'http://my.service/mfe1/remoteEntry.json',
        exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
        override: true,
        shared: [],
      };

      await updateCache(remoteEntry);

      expect(adapters.remoteInfoRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(adapters.scopedExternalsRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).toHaveBeenCalledWith('team/mfe1');
    });

    it('should not remove the old version if the remoteEntry is not marked as override', async () => {
      const remoteEntry = {
        name: 'team/mfe1',
        url: 'http://my.service/mfe1/remoteEntry.json',
        exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
        override: false,
        shared: [],
      };

      await updateCache(remoteEntry);

      expect(adapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(adapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
    });

    it('should not remove the old version if the remoteEntry is missing the override flag', async () => {
      const remoteEntry = {
        name: 'team/mfe1',
        url: 'http://my.service/mfe1/remoteEntry.json',
        exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
        shared: [],
      };

      await updateCache(remoteEntry);

      expect(adapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(adapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
    });
  });

  describe('addRemoteInfoToStorage', () => {
    it('should add remote info with exposed modules to storage', async () => {
      const remoteEntry = {
        name: 'team/mfe1',
        url: 'http://my.service/mfe1/remoteEntry.json',
        exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
        shared: [],
      };

      const actual = await updateCache(remoteEntry);

      expect(adapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledWith('team/mfe1', {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [{ moduleName: './wc-comp-a', file: 'component-a.js' }],
      });
      expect(actual.actions).toEqual({});
    });
  });
});
