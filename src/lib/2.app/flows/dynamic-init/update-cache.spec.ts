import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { mockScopedExternalsRepository } from 'lib/6.mocks/adapters/scoped-externals.repository.mock';
import { createVersionCheck } from 'lib/3.adapters/checks/version.check';
import { SharedVersion, Version } from 'lib/1.domain/externals/version.contract';
import { Optional } from 'lib/utils/optional';
import { ForUpdatingCache } from 'lib/2.app/driver-ports/dynamic-init/for-updating-cache';
import { createUpdateCache } from './update-cache';
import { ModeConfig } from 'lib/2.app/config/mode.contract';

describe('createProcessDynamicRemoteEntry', () => {
  let updateCache: ForUpdatingCache;
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
    mockAdapters.remoteInfoRepo.tryGetScope = jest.fn(remote => {
      if (remote === 'team/mfe1') return Optional.of('http://my.service/mfe1/');
      if (remote === 'team/mfe2') return Optional.of('http://my.service/mfe2/');
      return Optional.empty<string>();
    });
    mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(_e =>
      Optional.empty<SharedVersion[]>()
    );

    updateCache = createUpdateCache(mockConfig, mockAdapters);
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

      expect(mockAdapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledWith('team/mfe1', {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [{ moduleName: './wc-comp-a', file: 'component-a.js' }],
      });
      expect(actual.actions).toEqual({});
    });
  });

  describe('mergeExternalsIntoStorage - scoped', () => {
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

      expect(mockAdapters.scopedExternalsRepo.addExternal).toHaveBeenCalledTimes(1);
      expect(mockAdapters.scopedExternalsRepo.addExternal).toHaveBeenCalledWith(
        'team/mfe1',
        'dep-a',
        {
          version: '1.2.3',
          file: 'dep-a.js',
        } as Version
      );

      expect(actual.actions).toEqual({});
    });

    it('should skip a version with a bad version', async () => {
      const remoteEntry = {
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
      };

      await updateCache(remoteEntry);

      expect(mockAdapters.scopedExternalsRepo.addExternal).not.toHaveBeenCalled();
      expect(mockConfig.log.debug).toHaveBeenCalledWith(
        "[8][team/mfe1][dep-a] Version 'bad-semver' is not a valid version, skipping version."
      );
    });
  });

  describe('mergeExternalsIntoStorage - shared', () => {
    beforeEach(() => {
      mockAdapters.sharedExternalsRepo.scopeType = jest.fn(() => 'global');
    });
    it('should add a shared external to empty list', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> => Optional.empty()
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

      // dirty: false because dynamic init does not replace/remove existing versions
      // action: share because no version exists in cache
      // cached: true because this will be included in the importMap
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
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
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.4',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

      // dirty: false because dynamic init does not replace/remove existing versions
      // action: skip because a compatible version already exists in cache
      // cached: false because this will not be included in the importMap
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '1.2.4',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            } as SharedVersion,
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
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

      expect(actual.actions).toEqual({
        'dep-a': { action: 'skip' },
      });
    });

    it('should add and skip shared external to list with incompatible version and not strictVersion', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '2.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

      // dirty: false because dynamic init does not replace/remove existing versions
      // action: scope because an incompatible version already exists in cache
      // cached: false because this will not be included in the importMap
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '2.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            } as SharedVersion,
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
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

      expect(actual.actions).toEqual({
        'dep-a': { action: 'skip' },
      });
    });

    it('should add and scope shared external to list with incompatible version and strictVersion', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '2.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

      // dirty: false because dynamic init does not replace/remove existing versions
      // action: scope because an incompatible version already exists in cache
      // cached: true because this will be included in the importMap
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '2.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            } as SharedVersion,
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
              requiredVersion: '~1.2.1',
              strictVersion: true,
              cached: true,
              host: false,
              action: 'scope',
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
      mockConfig.strict = true;

      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '2.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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
        `dep-a@1.2.3 from remote team/mfe1 is not compatible with team/mfe2.`
      );
    });

    it('should skip a shared external to list with same version', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
              usedBy: ['team/mfe1'],
            } as SharedVersion,
          ],
        },
        undefined
      );
      expect(result.actions).toEqual({
        'dep-a': { action: 'skip' },
      });
    });

    it('should skip a version with a bad version', async () => {
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).not.toHaveBeenCalled();
      expect(mockConfig.log.debug).toHaveBeenCalledWith(
        "[8][team/mfe1][dep-a] Version 'bad-semver' is not a valid version, skipping version."
      );
    });
  });
  describe('mergeExternalsIntoStorage - shareScope', () => {
    beforeEach(() => {
      mockAdapters.sharedExternalsRepo.scopeType = jest.fn(() => 'shareScope');
    });
    it('should add an override external if shared compatible external exists', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.4',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '1.2.4',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            } as SharedVersion,
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
              requiredVersion: '~1.2.1',
              strictVersion: true,
              cached: false,
              host: false,
              action: 'override',
            } as SharedVersion,
          ],
        },
        'custom-scope'
      );

      expect(actual.actions).toEqual({
        'dep-a': { action: 'override', override: 'http://my.service/mfe2/' },
      });
    });

    it('should override a shared external to list with same version when shareScope', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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
            outFileName: 'dep-a.js',
          },
        ],
      };

      const result = await updateCache(remoteEntry);

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
              usedBy: ['team/mfe1'],
            } as SharedVersion,
          ],
        },
        'custom-scope'
      );
      expect(result.actions).toEqual({
        'dep-a': { action: 'override', override: 'http://my.service/mfe2/' },
      });
    });

    it('should add an scoped external if shared incompatible external exists', async () => {
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> =>
          Optional.of([
            {
              version: '2.2.4',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            },
          ])
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

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '2.2.4',
              file: 'dep-a.js',
              remote: 'team/mfe2',
              requiredVersion: '~2.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
            } as SharedVersion,
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
              requiredVersion: '~1.2.1',
              strictVersion: true,
              cached: true,
              host: false,
              action: 'scope',
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
      mockAdapters.sharedExternalsRepo.tryGetVersions = jest.fn(
        (): Optional<SharedVersion[]> => Optional.empty()
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
            shareScope: 'custom-scope',
            singleton: true,
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
          },
        ],
      };

      const actual = await updateCache(remoteEntry);

      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        {
          dirty: false,
          versions: [
            {
              version: '1.2.3',
              file: 'dep-a.js',
              remote: 'team/mfe1',
              requiredVersion: '~1.2.1',
              strictVersion: false,
              cached: true,
              host: false,
              action: 'share',
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
});
