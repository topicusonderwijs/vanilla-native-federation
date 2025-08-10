import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { mockExternal_E, mockExternal_F } from 'lib/6.mocks/domain/externals/external.mock';
import { mockScopeUrl_MFE1, mockScopeUrl_MFE2 } from 'lib/6.mocks/domain/scope-url.mock';

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
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({}));
    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/mfe1') return Optional.of(mockRemoteInfo_MFE1({ exposes: [] }));
      if (remote === 'team/mfe2') return Optional.of(mockRemoteInfo_MFE2({ exposes: [] }));

      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should add a scoped externals to its respective scope.', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe1': { ...mockExternal_E(), ...mockExternal_F() },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-e': mockScopeUrl_MFE1({ file: 'dep-e.js' }),
          'dep-f': mockScopeUrl_MFE1({ file: 'dep-f.js' }),
        },
      },
    });
  });

  it('should handle multiple scopes.', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe1': { ...mockExternal_E() },
      'team/mfe2': { ...mockExternal_F() },
    }));

    const actual = await generateImportMap();

    expect(actual).toEqual({
      imports: {},
      scopes: {
        [mockScopeUrl_MFE1()]: {
          'dep-e': mockScopeUrl_MFE1({ file: 'dep-e.js' }),
        },
        [mockScopeUrl_MFE2()]: {
          'dep-f': mockScopeUrl_MFE2({ file: 'dep-f.js' }),
        },
      },
    });
  });

  it('should throw an error if the remote doesnt exist', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe3': { ...mockExternal_E() },
    }));

    await expect(generateImportMap()).rejects.toThrow('Could not create ImportMap.');
    expect(config.log.error).toHaveBeenCalledWith(
      4,
      `[scoped][team/mfe3] Remote name not found in cache.`
    );
  });
});
