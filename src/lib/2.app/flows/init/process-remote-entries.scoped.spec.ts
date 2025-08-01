import { createProcessRemoteEntries } from './process-remote-entries';
import { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Version } from 'lib/1.domain/externals/version.contract';
import { Optional } from 'lib/utils/optional';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createProcessRemoteEntries - scoped', () => {
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

  describe('default cases', () => {
    it('should add a shared external', async () => {
      const remoteEntries = [
        {
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
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledTimes(1);
      expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledWith('team/mfe1', 'dep-a', {
        tag: '1.2.3',
        file: 'dep-a.js',
      } as Version);
    });
  });

  describe('handling a missing version property', () => {
    it('should add the correct tag if missing', async () => {
      adapters.versionCheck.smallestVersion = jest.fn((): string => '1.2.1');

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

      await processRemoteEntries(remoteEntries);

      expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledTimes(1);
      expect(adapters.scopedExternalsRepo.addExternal).toHaveBeenCalledWith('team/mfe1', 'dep-a', {
        tag: '1.2.1',
        file: 'dep-a.js',
      } as Version);
      expect(config.log.warn).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
      );
    });
  });
});
