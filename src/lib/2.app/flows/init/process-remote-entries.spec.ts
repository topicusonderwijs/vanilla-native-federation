import { createProcessRemoteEntries } from './process-remote-entries';
import { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Optional } from 'lib/utils/optional';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createProcessRemoteEntries', () => {
  let processRemoteEntries: ForProcessingRemoteEntries;
  let config: LoggingConfig & ModeConfig;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.sharedExternalsRepo.tryGet = jest.fn(_e => Optional.empty<SharedExternal>());

    processRemoteEntries = createProcessRemoteEntries(config, adapters);

    adapters.versionCheck.isValidSemver = jest.fn(() => true);
    adapters.versionCheck.compare = jest.fn(() => 0);
  });

  describe('cleaning up before processing', () => {
    it('should remove the previous cached version if remoteEntry is marked as override', async () => {
      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
          override: true,
          shared: [],
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(adapters.scopedExternalsRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).toHaveBeenCalledWith('team/mfe1');
    });

    it('should not remove the old version if the remoteEntry is not marked as override', async () => {
      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
          override: false,
          shared: [],
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(adapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
    });

    it('should not remove the old version if the remoteEntry is missing the override flag', async () => {
      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
          shared: [],
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(adapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
    });
  });

  describe('process remote infos', () => {
    it('should process remote entries and add them to repositories', async () => {
      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
          shared: [],
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledWith('team/mfe1', {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [{ moduleName: './wc-comp-a', file: 'component-a.js' }],
      });
    });
  });

  describe('handling a missing version property', () => {
    it('should handle invalid versions in strict mode', async () => {
      config.strict = true;
      adapters.versionCheck.isValidSemver = jest.fn(() => false);

      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [],
          shared: [
            {
              version: 'invalid-version',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              singleton: false,
              packageName: 'dep-a',
              outFileName: 'dep-a.js',
            },
          ],
        },
      ];
      await expect(processRemoteEntries(remoteEntries)).rejects.toThrow(
        "Could not process remote 'team/mfe1'"
      );
      expect(config.log.error).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'invalid-version' is not a valid version."
      );
    });

    it('should handle undefined versions in strict mode', async () => {
      config.strict = true;
      adapters.versionCheck.isValidSemver = jest.fn(() => false);

      const remoteEntries = [
        {
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
        },
      ];
      await expect(processRemoteEntries(remoteEntries)).rejects.toThrow(
        "Could not process remote 'team/mfe1'"
      );
      expect(config.log.error).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
      );
    });
  });
});
