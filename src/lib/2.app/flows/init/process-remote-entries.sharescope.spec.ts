import { createProcessRemoteEntries } from './process-remote-entries';
import { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Optional } from 'lib/utils/optional';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { mockRemoteEntry_MFE1 } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { mockSharedInfoA } from 'lib/6.mocks/domain/remote-entry/shared-info.mock';
import { mockVersion_A } from 'lib/6.mocks/domain/externals/version.mock';
import { mockExternal } from 'lib/6.mocks/domain/externals/external.mock';

describe('createProcessRemoteEntries - shareScope', () => {
  let processRemoteEntries: ForProcessingRemoteEntries;
  let config: LoggingConfig & ModeConfig;
  let adapters: DrivingContract;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.sharedExternalsRepo.tryGet = jest.fn(_e => Optional.empty<SharedExternal>());

    processRemoteEntries = createProcessRemoteEntries(config, adapters);

    adapters.versionCheck.isValidSemver = jest.fn(() => true);
    adapters.versionCheck.compare = jest.fn(() => 0);
  });

  it('should add to shareScope', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn((): Optional<SharedExternal> => Optional.empty());

    const remoteEntries = [
      mockRemoteEntry_MFE1({ shared: [mockSharedInfoA.v2_1_2({ shareScope: 'custom-scope' })] }),
    ];

    await processRemoteEntries(remoteEntries);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared([mockVersion_A.v2_1_2({ remotes: ['team/mfe1'] })], { dirty: true }),
      'custom-scope'
    );
  });

  it('should handle "strict" shareScope', async () => {
    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'strict');

    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [
              mockVersion_A.v2_1_1({
                remotes: { 'team/mfe2': { requiredVersion: '2.1.1' } },
                action: 'share',
              }),
            ],
            { dirty: false }
          )
        )
    );

    const remoteEntries = [
      mockRemoteEntry_MFE1({
        shared: [mockSharedInfoA.v2_1_2({ shareScope: 'strict', requiredVersion: '2.1.2' })],
      }),
    ];

    await processRemoteEntries(remoteEntries);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [
          mockVersion_A.v2_1_1({
            remotes: { 'team/mfe2': { requiredVersion: '2.1.1' } },
            action: 'share',
          }),
          mockVersion_A.v2_1_2({
            remotes: { 'team/mfe1': { requiredVersion: '2.1.2' } },
            action: 'share',
          }),
        ],
        { dirty: false }
      ),
      'strict'
    );
  });
});
