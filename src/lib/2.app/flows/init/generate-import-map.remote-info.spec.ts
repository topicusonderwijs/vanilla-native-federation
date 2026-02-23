import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { mockScopeUrl_MFE1, mockScopeUrl_MFE2 } from 'lib/6.mocks/domain/scope-url.mock';
import { Optional, RemoteInfo } from 'lib/sdk.index';

describe('createGenerateImportMap (remoteInfos)', () => {
  let generateImportMap: ForGeneratingImportMap;
  let adapters: DrivingContract;
  let config: LoggingConfig & ModeConfig;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.getAll = jest.fn(() => ({}));
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({}));
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({}));
    adapters.remoteInfoRepo.tryGet = jest.fn(remoteName => {
      if (remoteName === 'team/mfe1') return Optional.of(mockRemoteInfo_MFE1());
      if (remoteName === 'team/mfe2') return Optional.of(mockRemoteInfo_MFE2());
      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add the remote modules to the global scope.', async () => {
    adapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': mockRemoteInfo_MFE1(),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe1/./wc-comp-a': mockScopeUrl_MFE1({ file: 'component-a.js' }),
      },
    });
  });

  it('should add multiple remotes.', async () => {
    adapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': mockRemoteInfo_MFE1(),
      'team/mfe2': mockRemoteInfo_MFE2(),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe1/./wc-comp-a': mockScopeUrl_MFE1({ file: 'component-a.js' }),
        'team/mfe2/./wc-comp-b': mockScopeUrl_MFE2({ file: 'component-b.js' }),
        'team/mfe2/./wc-comp-c': mockScopeUrl_MFE2({ file: 'component-c.js' }),
      },
    });
  });

  it('should handle remotes without modules.', async () => {
    adapters.remoteInfoRepo.getAll = jest.fn(() => ({
      'team/mfe1': mockRemoteInfo_MFE1({ exposes: [] }),
      'team/mfe2': mockRemoteInfo_MFE2(),
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {
        'team/mfe2/./wc-comp-b': mockScopeUrl_MFE2({ file: 'component-b.js' }),
        'team/mfe2/./wc-comp-c': mockScopeUrl_MFE2({ file: 'component-c.js' }),
      },
    });
  });
});
