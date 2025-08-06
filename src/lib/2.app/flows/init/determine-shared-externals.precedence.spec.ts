import { ForDeterminingSharedExternals } from '../../driver-ports/init/for-determining-shared-externals.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createDetermineSharedExternals } from './determine-shared-externals';
import { GLOBAL_SCOPE } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

/**
 * This tests the precedence of the different external versions
 */
describe('createDetermineSharedExternals (compatibility precedence)', () => {
  let determineSharedExternals: ForDeterminingSharedExternals;
  let config: any;
  let adapters: Pick<DrivingContract, 'versionCheck' | 'sharedExternalsRepo'>;

  beforeEach(() => {
    config = mockConfig();

    adapters = mockAdapters();

    adapters.sharedExternalsRepo.getScopes = jest.fn(() => [GLOBAL_SCOPE]);
    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'global');
    determineSharedExternals = createDetermineSharedExternals(config, adapters);
  });

  it('should set the host version if available', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
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

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
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

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
    config.strict = false;
    adapters.versionCheck.isCompatible = jest.fn((a, b) => a.substring(0, 2) === b.substring(1, 3));

    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
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

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
    config.strict = false;
    config.profile.latestSharedExternal = true;

    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
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

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
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
