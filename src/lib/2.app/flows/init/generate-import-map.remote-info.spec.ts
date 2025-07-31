import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createGenerateImportMap (remoteInfos)', () => {
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

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add the remote modules to the global scope.', async () => {
    adapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [
          { moduleName: './wc-comp-a', file: 'component-a.js' },
          { moduleName: './wc-comp-b', file: 'component-b.js' },
        ],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe1/./wc-comp-a': 'http://my.service/mfe1/component-a.js',
        'team/mfe1/./wc-comp-b': 'http://my.service/mfe1/component-b.js',
      },
    });
  });

  it('should add multiple remotes.', async () => {
    adapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [
          { moduleName: './wc-comp-a', file: 'component-a.js' },
          { moduleName: './wc-comp-b', file: 'component-b.js' },
        ],
      },
      'team/mfe2': {
        scopeUrl: 'http://my.service/mfe2/',
        exposes: [{ moduleName: './wc-comp-c', file: 'component-c.js' }],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe1/./wc-comp-a': 'http://my.service/mfe1/component-a.js',
        'team/mfe1/./wc-comp-b': 'http://my.service/mfe1/component-b.js',
        'team/mfe2/./wc-comp-c': 'http://my.service/mfe2/component-c.js',
      },
    });
  });

  it('should handle remotes without modules.', async () => {
    adapters.remoteInfoRepo.getAll = jest.fn(() => ({
      '__NF-HOST__': {
        scopeUrl: 'http://my.service/mfe1/',
        exposes: [],
      },
      'team/mfe2': {
        scopeUrl: 'http://my.service/mfe2/',
        exposes: [{ moduleName: './wc-comp-c', file: 'component-c.js' }],
      },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe2/./wc-comp-c': 'http://my.service/mfe2/component-c.js',
      },
    });
  });
});
