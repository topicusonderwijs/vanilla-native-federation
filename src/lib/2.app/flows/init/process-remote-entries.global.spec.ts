import { createProcessRemoteEntries } from './process-remote-entries';
import { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Optional } from 'lib/utils/optional';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteEntry_HOST,
  mockRemoteEntry_MFE1,
  mockRemoteEntry_MFE2,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { mockSharedInfo, mockSharedInfoA } from 'lib/6.mocks/domain/remote-entry/shared-info.mock';
import { mockExternal } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion, mockVersion_A } from 'lib/6.mocks/domain/externals/version.mock';

describe('createProcessRemoteEntries - global', () => {
  let processRemoteEntries: ForProcessingRemoteEntries;
  let config: LoggingConfig & ModeConfig;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    processRemoteEntries = createProcessRemoteEntries(config, adapters);

    adapters.sharedExternalsRepo.tryGet = jest.fn(() => Optional.empty<SharedExternal>());
    adapters.versionCheck.isValidSemver = jest.fn(() => true);
    adapters.versionCheck.compare = jest.fn(() => 0);
  });

  describe('process shared externals - default cases', () => {
    it('should add a shared external to an empty list', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> => Optional.empty()
      );
      const remoteEntries = [mockRemoteEntry_MFE1({ shared: [mockSharedInfoA.v2_1_2()] })];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared([mockVersion_A.v2_1_2({ remotes: ['team/mfe1'] })], { dirty: true }),
        undefined
      );
    });

    it('should add a shared external version to an external', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' })],
              { dirty: false }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_MFE2({ exposes: [], shared: [mockSharedInfoA.v2_1_1()] }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' }),
            mockVersion_A.v2_1_1({ remotes: ['team/mfe2'], action: 'skip' }),
          ],
          { dirty: true }
        ),
        undefined
      );
    });
  });

  describe('process shared externals - Handle duplicate versions', () => {
    it('should add remote if exact version already exists in cache', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' })],
              { dirty: false }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_MFE2({ exposes: [], shared: [mockSharedInfoA.v2_1_2()] }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_2({
              remotes: ['team/mfe1', 'team/mfe2'],
              action: 'skip',
            }),
          ],
          { dirty: false }
        ),
        undefined
      );
    });

    it('should not skip shared external if in cache, but new version is from host remoteEntry', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' })],
              { dirty: false }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_HOST({ exposes: [], shared: [mockSharedInfoA.v2_1_2()], host: true }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_2({
              remotes: ['team/host', 'team/mfe1'],
              action: 'skip',
              host: true,
            }),
          ],
          { dirty: false }
        ),
        undefined
      );
    });

    it('should mark shared external if in cache and both are host version', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip', host: true })],
              { dirty: false }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_MFE2({ exposes: [], shared: [mockSharedInfoA.v2_1_2()], host: true }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_2({
              remotes: ['team/mfe1', 'team/mfe2'],
              action: 'skip',
              host: true,
            }),
          ],
          { dirty: false }
        ),
        undefined
      );
    });

    it('should warn users if the requiredVersions differ and strictVersion', async () => {
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [
                mockVersion_A.v2_1_2({
                  remotes: { 'team/mfe1': { requiredVersion: '~1.2.1' } },
                  action: 'skip',
                }),
              ],
              { dirty: false }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_MFE2({
          exposes: [],
          shared: [mockSharedInfoA.v2_1_2({ requiredVersion: '~1.2.2' })],
        }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_2({
              remotes: {
                'team/mfe1': { requiredVersion: '~1.2.1' },
                'team/mfe2': { requiredVersion: '~1.2.2' },
              },
              action: 'skip',
            }),
          ],
          { dirty: false }
        ),
        undefined
      );

      expect(config.log.warn).toHaveBeenCalledWith(
        2,
        "[team/mfe2][dep-a@2.1.2] Required version-range '~1.2.2' does not match cached version-range '~1.2.1'"
      );
    });
    it('should not throw an error if the requiredVersions differs if strictVersion and in strict mode', async () => {
      config.strict = true;
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [
                mockVersion_A.v2_1_2({
                  remotes: { 'team/mfe1': { requiredVersion: '~1.2.1' } },
                  action: 'skip',
                }),
              ],
              { dirty: false }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_MFE2({
          exposes: [],
          shared: [mockSharedInfoA.v2_1_2({ requiredVersion: '~1.2.2' })],
        }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_2({
              remotes: {
                'team/mfe1': { requiredVersion: '~1.2.1' },
                'team/mfe2': { requiredVersion: '~1.2.2' },
              },
              action: 'skip',
            }),
          ],
          { dirty: false }
        ),
        undefined
      );

      expect(config.log.warn).toHaveBeenCalledWith(
        2,
        "[team/mfe2][dep-a@2.1.2] Required version-range '~1.2.2' does not match cached version-range '~1.2.1'"
      );
    });
  });

  describe('process shared externals - Handle version ordering', () => {
    beforeEach(() => {
      adapters.versionCheck.compare = jest.fn((a, b) => {
        const order = ['2.1.3', '2.1.2', '2.1.1'];
        return order.indexOf(b) - order.indexOf(a);
      });
    });

    it('should correctly order the the versions descending', async () => {
      adapters.versionCheck.isCompatible = jest.fn(() => true);

      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> =>
          Optional.of(
            mockExternal.shared(
              [
                mockVersion_A.v2_1_1({
                  remotes: { 'team/mfe1': { cached: false } },
                  action: 'skip',
                }),
                mockVersion_A.v2_1_3({
                  remotes: { 'team/mfe3': { cached: true } },
                  action: 'share',
                }),
              ],
              {
                dirty: false,
              }
            )
          )
      );

      const remoteEntries = [
        mockRemoteEntry_MFE2({
          exposes: [],
          shared: [mockSharedInfoA.v2_1_2()],
        }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion_A.v2_1_3({ remotes: { 'team/mfe3': { cached: true } }, action: 'share' }),
            mockVersion_A.v2_1_2({ remotes: { 'team/mfe2': { cached: false } }, action: 'skip' }),
            mockVersion_A.v2_1_1({ remotes: { 'team/mfe1': { cached: false } }, action: 'skip' }),
          ],
          { dirty: true }
        ),
        undefined
      );
    });
  });

  describe('handling a missing version property', () => {
    it('should add the correct tag if missing', async () => {
      adapters.versionCheck.smallestVersion = jest.fn((): string => '2.1.1');
      adapters.sharedExternalsRepo.tryGet = jest.fn(
        (): Optional<SharedExternal> => Optional.empty()
      );
      const remoteEntries = [
        mockRemoteEntry_MFE1({
          shared: [mockSharedInfo('dep-a', { requiredVersion: '~2.1.1', singleton: true })],
        }),
      ];

      await processRemoteEntries(remoteEntries);

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal.shared(
          [
            mockVersion.shared('2.1.1', 'dep-a', {
              remotes: { 'team/mfe1': { requiredVersion: '~2.1.1' } },
              action: 'skip',
            }),
          ],
          { dirty: true }
        ),
        undefined
      );
      expect(config.log.warn).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
      );
    });
  });
});
