import { createProcessRemoteEntries } from './process-remote-entries';
import { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { mockScopedExternalsRepository } from 'lib/6.mocks/adapters/scoped-externals.repository.mock';
import { createVersionCheck } from 'lib/3.adapters/checks/version.check';
import { SharedVersion, Version } from 'lib/1.domain/externals/version.contract';
import { Optional } from 'lib/utils/optional';
import { ModeConfig } from 'lib/2.app/config/mode.contract';

describe('createProcessRemoteEntries', () => {
  let processRemoteEntries: ForProcessingRemoteEntries;
  let mockConfig: LoggingConfig & ModeConfig;
  let mockAdapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >;

  beforeEach(() => {
    mockConfig = {
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        level: 'debug',
      },
      profile: {
        latestSharedExternal: false,
        skipCachedRemotes: 'never',
      },
      strict: false,
    } as LoggingConfig & ModeConfig;

    mockAdapters = {
      remoteInfoRepo: mockRemoteInfoRepository(),
      sharedExternalsRepo: mockSharedExternalsRepository(),
      scopedExternalsRepo: mockScopedExternalsRepository(),
      versionCheck: createVersionCheck(),
    };

    mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(_e =>
      Optional.empty<SharedVersion[]>()
    );

    processRemoteEntries = createProcessRemoteEntries(mockConfig, mockAdapters);
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

      expect(mockAdapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledWith('team/mfe1', {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [{ moduleName: './wc-comp-a', file: 'component-a.js' }],
      });
    });
  });

  describe('process scoped externals', () => {
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

      expect(mockAdapters.scopedExternalsRepo.addExternal).toHaveBeenCalledTimes(1);
      expect(mockAdapters.scopedExternalsRepo.addExternal).toHaveBeenCalledWith(
        'http://my.service/mfe1/',
        'dep-a',
        {
          version: '1.2.3',
          file: 'dep-a.js',
        } as Version
      );
    });

    it('should skip a version with a bad version', async () => {
      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [],
          shared: [
            {
              version: 'bad-semver',
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

      expect(mockAdapters.scopedExternalsRepo.addExternal).not.toHaveBeenCalled();
      expect(mockConfig.log.warn).toHaveBeenCalledWith(
        "[team/mfe1][dep-a] Version 'bad-semver' is not a valid version, skipping version."
      );
    });
  });

  describe('process shared externals', () => {
    it('should add a shared external', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> => Optional.empty()
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: true,
          versions: [
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: false,
              host: false,
              action: 'skip',
            } as SharedVersion,
          ],
        },
        undefined
      );
    });

    it('should add a shared external', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> => Optional.empty()
      );
      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [],
          shared: [
            {
              version: 'bad-version',
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

      expect(mockAdapters.scopedExternalsRepo.addExternal).not.toHaveBeenCalled();
      expect(mockConfig.log.warn).toHaveBeenCalledWith(
        "[team/mfe1][dep-a] Version 'bad-version' is not a valid version, skipping version."
      );
    });
  });

  describe('process shared externals - handle custom scopes', () => {
    it('should add a shared external', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> => Optional.empty()
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: true,
          versions: [
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: false,
              host: false,
              action: 'skip',
            } as SharedVersion,
          ],
        },
        'custom-scope'
      );
    });
  });

  describe('process shared externals - Handle version collisions', () => {
    it('should skip shared external if exact version already exists in cache', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).not.toHaveBeenCalledTimes(1);
    });

    it('should not skip shared external if in cache, but new version is from host remoteEntry', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
      );

      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [],
          host: true,
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: true,
          versions: [
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: false,
              host: true,
              action: 'skip',
            } as SharedVersion,
          ],
        },
        undefined
      );
    });

    it('should skip shared external if in cache and both are host version', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: true,
              action: 'share',
            },
          ])
      );

      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [],
          host: true,
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).not.toHaveBeenCalledTimes(1);
    });
  });

  describe('process shared externals - Handle version ordering', () => {
    it('should correctly order the the versions descending', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.4',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
            {
              version: '1.2.2',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: false,
              host: false,
              action: 'skip',
            },
          ])
      );

      const remoteEntries = [
        {
          name: 'team/mfe1',
          url: 'http://my.service/mfe1/remoteEntry.json',
          exposes: [],
          host: true,
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: true,
          versions: [
            {
              version: '1.2.4',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
            {
              version: '1.2.3',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: false,
              host: true,
              action: 'skip',
            },
            {
              version: '1.2.2',
              file: 'http://my.service/mfe1/dep-a.js',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: false,
              host: false,
              action: 'skip',
            },
          ],
        },
        undefined
      );
    });
  });
});
