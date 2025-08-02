import { createProcessRemoteEntries } from './process-remote-entries';
import { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { SharedVersion } from 'lib/1.domain/externals/version.contract';
import { Optional } from 'lib/utils/optional';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createProcessRemoteEntries - shareScope', () => {
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

  describe('process shared externals - default cases', () => {
    it('should add to shareScope', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> => Optional.empty()
      );
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
              shareScope: 'custom-scope',
              singleton: true,
              packageName: 'dep-a',
              outFileName: 'dep-a.js',
            },
          ],
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: true,
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
            } as SharedVersion,
          ],
        },
        'custom-scope'
      );
    });
  });

  describe('process shared externals - strict shareScope', () => {
    it('should add to shareScope', async () => {
      adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'strict');
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
                    requiredVersion: '1.2.4',
                    strictVersion: false,
                    cached: false,
                  },
                ],
                host: false,
                action: 'share',
              },
            ],
          })
      );
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
              shareScope: 'strict',
              singleton: true,
              packageName: 'dep-a',
              outFileName: 'dep-a.js',
            },
          ],
        },
      ];

      await processRemoteEntries(remoteEntries);

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
                  requiredVersion: '1.2.4',
                  strictVersion: false,
                  cached: false,
                },
              ],
              host: false,
              action: 'share',
            },
            {
              tag: '1.2.3',
              remotes: [
                {
                  file: 'dep-a.js',
                  name: 'team/mfe1',
                  requiredVersion: '1.2.3',
                  strictVersion: false,
                  cached: false,
                },
              ],
              host: false,
              action: 'share',
            } as SharedVersion,
          ],
        },
        'strict'
      );
    });
  });
});
