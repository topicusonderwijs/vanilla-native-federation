import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { NFError } from 'lib/native-federation.error';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createGenerateImportMap (shared-externals)', () => {
  let generateImportMap: ForGeneratingImportMap;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo'
  >;
  let config: LoggingConfig & ModeConfig;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.getAll = jest.fn(() => ({}));
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({}));
    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({}));
    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'host')
        return Optional.of({ scopeUrl: 'http://my.service/host/', exposes: [] });
      if (remote === 'team/mfe1')
        return Optional.of({ scopeUrl: 'http://my.service/mfe1/', exposes: [] });
      if (remote === 'team/mfe2')
        return Optional.of({ scopeUrl: 'http://my.service/mfe2/', exposes: [] });

      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add the shared externals to the global scope.', async () => {
    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
        ],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': 'http://my.service/mfe1/dep-a.js',
      },
    });
  });

  it('should only add the shared version of the shared external to the global scope.', async () => {
    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
            tag: '1.2.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'host',
                requiredVersion: '~1.2.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: true,
            action: 'share',
          },
          {
            tag: '1.2.1',
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
        ],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': 'http://my.service/host/dep-a.js',
      },
    });
  });

  it('should add the scoped version of the shared external to its own scope.', async () => {
    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
        dirty: false,
        versions: [
          {
            tag: '19.0.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe1',
                requiredVersion: '~19.0.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: false,
            action: 'share',
          },
          {
            tag: '19.0.2',
            remotes: [
              {
                file: 'dep-a.js',
                name: 'team/mfe3',
                requiredVersion: '~19.0.1',
                strictVersion: false,
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
                name: 'team/mfe2',
                requiredVersion: '~18.0.1',
                strictVersion: false,
                cached: false,
              },
            ],
            host: false,
            action: 'scope',
          },
        ],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': 'http://my.service/mfe1/dep-a.js',
      },
      scopes: {
        'http://my.service/mfe2/': {
          'dep-a': 'http://my.service/mfe2/dep-a.js',
        },
      },
    });
  });

  it('should update the version in storage as "cached".', async () => {
    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
            tag: '1.2.2',
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

    await generateImportMap();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith('dep-a', {
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
    });
  });

  it('should warn the user about 2 shared versions and choose the most recent one if in non-strict mode.', async () => {
    config.strict = false;

    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
            tag: '1.2.2',
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
            action: 'share',
          },
        ],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'dep-a': 'http://my.service/mfe1/dep-a.js',
      },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      4,
      'Singleton external dep-a has multiple shared versions.'
    );
  });

  it('should throw error if 2 shared versions and in strict mode.', async () => {
    config.strict = true;

    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
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
            tag: '1.2.2',
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
            action: 'share',
          },
        ],
      },
    }));

    await expect(generateImportMap()).rejects.toEqual(new NFError('Could not create ImportMap.'));
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      '[dep-a] Shared external has multiple shared versions.'
    );
  });

  it('should throw an error if the remote doesnt exist', async () => {
    adapters.sharedExternalsRepo.getAll = jest.fn(() => ({
      'dep-a': {
        dirty: false,
        versions: [
          {
            tag: '1.2.3',
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
            action: 'share',
          },
        ],
      },
    }));

    await expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      `[__GLOBAL__][dep-a][team/mfe3] Remote name not found in cache.`
    );
  });
});
