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
import { SharedExternal } from 'lib/1.domain';

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
        skipCachedRemotesIfURLMatches: true,
      },
      strict: false,
    } as LoggingConfig & ModeConfig;

    mockAdapters = {
      remoteInfoRepo: mockRemoteInfoRepository(),
      sharedExternalsRepo: mockSharedExternalsRepository(),
      scopedExternalsRepo: mockScopedExternalsRepository(),
      versionCheck: createVersionCheck(),
    };

    mockAdapters.sharedExternalsRepo.tryGet = jest.fn(_e => Optional.empty<SharedExternal>());

    processRemoteEntries = createProcessRemoteEntries(mockConfig, mockAdapters);
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

      expect(mockAdapters.remoteInfoRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(mockAdapters.scopedExternalsRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(mockAdapters.sharedExternalsRepo.removeFromAllScopes).toHaveBeenCalledWith(
        'team/mfe1'
      );
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

      expect(mockAdapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(mockAdapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(mockAdapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
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

      expect(mockAdapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(mockAdapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(mockAdapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
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
        'team/mfe1',
        'dep-a',
        {
          tag: '1.2.3',
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
        2,
        "[team/mfe1][dep-a] Version 'bad-semver' is not a valid version. skipping version."
      );
    });
  });

  describe('process shared externals', () => {
    it('should add a shared external', async () => {
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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

    it('should add a shared external', async () => {
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> => Optional.empty()
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
        2,
        "[team/mfe1][dep-a] Version 'bad-version' is not a valid version. skipping version."
      );
    });
  });

  describe('process shared externals - handle custom scopes', () => {
    it('should add a shared external', async () => {
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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

  describe('process shared externals - Handle version collisions', () => {
    it('should add remote if exact version already exists in cache', async () => {
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
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
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
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
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
  });

  describe('process shared externals - Handle version ordering', () => {
    it('should correctly order the the versions descending', async () => {
      mockAdapters.sharedExternalsRepo.tryGet = jest.fn(
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
});
