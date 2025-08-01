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

describe('createProcessRemoteEntries - global', () => {
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
    it('should add a shared external to an empty list', async () => {
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
        undefined
      );
    });

    it('should add a shared external version to an external', async () => {
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
                    cached: false,
                  },
                ],
                host: false,
                action: 'skip',
              } as SharedVersion,
            ],
          })
      );
      const remoteEntries = [
        {
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
              tag: '1.2.4',
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
              tag: '1.2.3',
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
            } as SharedVersion,
          ],
        },
        undefined
      );
    });
  });

  describe('process shared externals - Handle duplicate versions', () => {
    it('should add remote if exact version already exists in cache', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of({
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
                ],
                host: false,
                action: 'skip',
              },
            ],
          })
      );

      const remoteEntries = [
        {
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
              outFileName: 'dep-a-def.js',
            },
          ],
        },
      ];

      await processRemoteEntries(remoteEntries);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
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
              action: 'skip',
            } as SharedVersion,
          ],
        },
        undefined
      );
    });

    it('should not skip shared external if in cache, but new version is from host remoteEntry', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of({
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
                ],
                host: false,
                action: 'skip',
              },
            ],
          })
      );

      const remoteEntries = [
        {
          name: 'team/mfe2',
          host: true,
          url: 'http://my.service/mfe2/remoteEntry.json',
          exposes: [],
          shared: [
            {
              version: '1.2.3',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              singleton: true,
              packageName: 'dep-a',
              outFileName: 'dep-a-def.js',
            },
          ],
        },
      ];

      await processRemoteEntries(remoteEntries);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              tag: '1.2.3',
              remotes: [
                {
                  file: 'dep-a-def.js',
                  name: 'team/mfe2',
                  requiredVersion: '~1.2.1',
                  strictVersion: false,
                  cached: false,
                },
                {
                  file: 'dep-a-abc.js',
                  name: 'team/mfe1',
                  requiredVersion: '~1.2.1',
                  strictVersion: false,
                  cached: true,
                },
              ],
              host: true,
              action: 'skip',
            } as SharedVersion,
          ],
        },
        undefined
      );
    });

    it('should mark shared external if in cache and both are host version', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of({
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
                ],
                host: true,
                action: 'skip',
              },
            ],
          })
      );

      const remoteEntries = [
        {
          name: 'team/mfe2',
          url: 'http://my.service/mfe2/remoteEntry.json',
          exposes: [],
          host: true,
          shared: [
            {
              version: '1.2.3',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              singleton: true,
              packageName: 'dep-a',
              outFileName: 'dep-a-def.js',
            },
          ],
        },
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
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
              host: true,
              action: 'skip',
            } as SharedVersion,
          ],
        },
        undefined
      );
    });

    it('should warn users if the requiredVersions differ and strictVersion', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of({
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
                ],
                host: false,
                action: 'skip',
              },
            ],
          })
      );

      const remoteEntries = [
        {
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
              outFileName: 'dep-a-def.js',
            },
          ],
        },
      ];

      await processRemoteEntries(remoteEntries);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
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
                  requiredVersion: '~1.2.2',
                  strictVersion: true,
                  cached: false,
                },
              ],
              host: false,
              action: 'skip',
            } as SharedVersion,
          ],
        },
        undefined
      );

      expect(config.log.warn).toHaveBeenCalledWith(
        2,
        "[team/mfe2][dep-a@1.2.3] Required version '~1.2.2' does not match existing '~1.2.1'"
      );
    });
    it('should throw an error if the requiredVersions differs if strictVersion and in strict mode', async () => {
      config.strict = true;
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of({
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
                ],
                host: false,
                action: 'skip',
              },
            ],
          })
      );

      const remoteEntries = [
        {
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
              outFileName: 'dep-a-def.js',
            },
          ],
        },
      ];

      await expect(processRemoteEntries(remoteEntries)).rejects.toThrow(
        "Could not process remote 'team/mfe2'"
      );

      expect(config.log.error).toHaveBeenCalledWith(
        2,
        "[team/mfe2][dep-a@1.2.3] Required version '~1.2.2' does not match existing '~1.2.1'"
      );
    });
  });

  describe('process shared externals - Handle version ordering', () => {
    beforeEach(() => {
      adapters.versionCheck.compare = jest.fn((a, b) => {
        const order = ['1.2.4', '1.2.3', '1.2.2'];
        return order.indexOf(b) - order.indexOf(a);
      });
    });

    it('should correctly order the the versions descending', async () => {
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
                    name: 'team/mfe3',
                    requiredVersion: '~1.2.1',
                    strictVersion: false,
                    cached: false,
                  },
                ],
                host: false,
                action: 'skip',
              },
            ],
          })
      );

      const remoteEntries = [
        {
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
              tag: '1.2.3',
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
            {
              tag: '1.2.2',
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
            },
          ],
        },
        undefined
      );
    });
  });

  describe('handling a missing version property', () => {
    it('should add the correct tag if missing', async () => {
      adapters.versionCheck.smallestVersion = jest.fn((): string => '1.2.3');
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
              requiredVersion: '~1.2.1',
              strictVersion: false,
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
        undefined
      );
      expect(config.log.warn).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
      );
    });
  });
});
