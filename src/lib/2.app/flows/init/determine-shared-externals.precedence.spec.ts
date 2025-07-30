import { ForDeterminingSharedExternals } from '../../driver-ports/init/for-determining-shared-externals.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createDetermineSharedExternals } from './determine-shared-externals';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { createVersionCheck } from 'lib/3.adapters/checks/version.check';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { GLOBAL_SCOPE } from 'lib/1.domain';

/**
 * This tests the precedence of the different external versions
 */
describe('createDetermineSharedExternals (compatibility precedence)', () => {
  let determineSharedExternals: ForDeterminingSharedExternals;
  let mockConfig: any;
  let mockAdapters: Pick<DrivingContract, 'versionCheck' | 'sharedExternalsRepo'>;

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
      versionCheck: createVersionCheck(),
      sharedExternalsRepo: mockSharedExternalsRepository(),
    };
    mockAdapters.sharedExternalsRepo.getScopes = jest.fn(() => [GLOBAL_SCOPE]);
    mockAdapters.sharedExternalsRepo.scopeType = jest.fn(() => 'global');
    determineSharedExternals = createDetermineSharedExternals(mockConfig, mockAdapters);
  });

  it('should set the host version if available', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
          },
          {
            tag: '1.2.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: true,
            action: 'skip',
          },
        ],
      },
    }));

    await determineSharedExternals();

    expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
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
          },
          {
            tag: '1.2.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: true,
            action: 'share',
          },
        ],
      },
      GLOBAL_SCOPE
    );
  });

  it('should set the latest version if all equal', async () => {
    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
          },
          {
            tag: '1.2.1',
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
        ],
      },
    }));

    await determineSharedExternals();

    expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
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
            action: 'share',
          },
          {
            tag: '1.2.1',
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
        ],
      },
      GLOBAL_SCOPE
    );
  });

  it('Should choose latest most compatible version if no host version available', async () => {
    mockConfig.strict = false;

    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
        dirty: true,
        versions: [
          {
            tag: '19.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~19.0.1',
                strictVersion: true,
                cached: false,
              },
            ],

            host: false,
            action: 'skip',
          },
          {
            tag: '18.0.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'skip',
          },
          {
            tag: '18.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe3',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'skip',
          },
        ],
      },
    }));

    await determineSharedExternals();

    expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '19.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~19.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'scope', // because 18.0.1 and 18.0.2 are compatible, this version will be excluded
          },
          {
            tag: '18.0.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'share',
          },
          {
            tag: '18.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe3',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],

            host: false,
            action: 'skip',
          },
        ],
      },
      GLOBAL_SCOPE
    );
  });

  it('Should prioritize latest version if config is enabled', async () => {
    mockConfig.strict = false;
    mockConfig.profile.latestSharedExternal = true;

    mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
        dirty: true,
        versions: [
          {
            tag: '19.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~19.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'skip',
          },
          {
            tag: '18.0.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'skip',
          },
          {
            tag: '18.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe3',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'skip',
          },
        ],
      },
    }));

    await determineSharedExternals();

    expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      {
        dirty: false,
        versions: [
          {
            tag: '19.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~19.0.1',
                strictVersion: true,
                cached: false,
              },
            ],

            host: false,
            action: 'share', // Prioritizes latest version because it was defined in the config
          },
          {
            tag: '18.0.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe2',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'scope',
          },
          {
            tag: '18.0.1',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe3',
                requiredVersion: '~18.0.1',
                strictVersion: true,
                cached: false,
              },
            ],
            host: false,
            action: 'scope',
          },
        ],
      },
      GLOBAL_SCOPE
    );
  });
});
