import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createGenerateImportMap (scoped-externals)', () => {
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
      if (remote === 'team/mfe1')
        return Optional.of({ scopeUrl: 'http://my.service/mfe1/', exposes: [] });
      if (remote === 'team/mfe2')
        return Optional.of({ scopeUrl: 'http://my.service/mfe2/', exposes: [] });

      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add a scoped externals to its respective scope.', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        'dep-a': {
          tag: '1.2.3',
          file: 'dep-a.js',
        },
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
      },
    });
  });

  it('should handle multiple scopes.', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        'dep-a': {
          tag: '1.2.3',
          file: 'dep-a.js',
        },
      },
      'team/mfe2': {
        'dep-b': {
          tag: '1.2.3',
          file: 'dep-b.js',
        },
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
        'http://my.service/mfe2/': {
          'dep-b': 'http://my.service/mfe2/dep-b.js',
        },
      },
    });
  });

  it('should handle multiple externals in 1 scope.', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        'dep-a': {
          tag: '1.2.3',
          file: 'dep-a.js',
        },
        'dep-b': {
          tag: '1.2.3',
          file: 'dep-b.js',
        },
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        'http://my.service/mfe1/': {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
          'dep-b': 'http://my.service/mfe1/dep-b.js',
        },
      },
    });
  });

  it('should throw an error if the remote doesnt exist', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe3': {
        'dep-a': {
          tag: '1.2.3',
          file: 'dep-a.js',
        },
      },
    }));

    await expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      `[scoped][team/mfe3] Remote name not found in cache.`
    );
  });
});
