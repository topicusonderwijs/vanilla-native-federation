import { DrivingContract } from '../../driving-ports/driving.contract';
import { LoggingConfig } from '../../config/log.contract';
import { Optional } from 'lib/utils/optional';
import { ForUpdatingCache } from 'lib/2.app/driver-ports/dynamic-init/for-updating-cache';
import { createUpdateCache } from './update-cache';
import { ModeConfig } from 'lib/2.app/config/mode.contract';
import { RemoteInfo, SharedExternal } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import {
  mockRemoteEntry_MFE1,
  mockRemoteEntry_MFE2,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import {
  mockSharedInfo,
  mockSharedInfoA,
  mockSharedInfoB,
} from 'lib/6.mocks/domain/remote-entry/shared-info.mock';
import {
  mockVersion,
  mockVersion_A,
  mockVersion_B,
} from 'lib/6.mocks/domain/externals/version.mock';
import { mockExternal } from 'lib/6.mocks/domain/externals/external.mock';

describe('createProcessDynamicRemoteEntry - scoped', () => {
  let updateCache: ForUpdatingCache;
  let config: LoggingConfig & ModeConfig;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.versionCheck.isValidSemver = jest.fn(() => true);
    adapters.versionCheck.compare = jest.fn(() => 0);

    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/mfe2') return Optional.of(mockRemoteInfo_MFE2({ exposes: [] }));
      if (remote === 'team/mfe1') return Optional.of(mockRemoteInfo_MFE1({ exposes: [] }));
      return Optional.empty<RemoteInfo>();
    });

    adapters.sharedExternalsRepo.tryGet = jest.fn(_e => Optional.empty<SharedExternal>());
    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'global');

    updateCache = createUpdateCache(config, adapters);
  });

  it('should add a shared external to empty list', async () => {
    adapters.sharedExternalsRepo.tryGet = jest.fn((): Optional<SharedExternal> => Optional.empty());

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoA.v2_1_1()],
      exposes: [],
    });

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: share because no version exists in cache
    // cached: true because this will be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [mockVersion_A.v2_1_1({ remotes: { 'team/mfe1': { cached: true } }, action: 'share' })],
        { dirty: false }
      ),
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'share', override: undefined },
    });
  });

  it('should add a shared external to list with compatible version', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [mockVersion_A.v2_1_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' })],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoA.v2_1_1()],
      exposes: [],
    });

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: skip because a compatible version already exists in cache
    // cached: false because this will not be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [
          mockVersion_A.v2_1_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' }),
          mockVersion_A.v2_1_1({ remotes: { 'team/mfe1': { cached: false } }, action: 'skip' }),
        ],
        { dirty: false }
      ),
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
  });

  it('should add and skip shared external to list with incompatible version and not strictVersion', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => false);
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [mockVersion_B.v2_2_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' })],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoB.v2_1_1({ strictVersion: false })],
      exposes: [],
    });

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: scope because an incompatible version already exists in cache
    // cached: false because this will not be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-b',
      mockExternal.shared(
        [
          mockVersion_B.v2_2_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' }),
          mockVersion_B.v2_1_1({
            remotes: { 'team/mfe1': { cached: false, strictVersion: false } },
            action: 'skip',
          }),
        ],
        { dirty: false }
      ),
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-b': { action: 'skip' },
    });
  });

  it('should add and scope shared external to list with incompatible version and strictVersion', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => false);
    config.strict.strictExternalCompatibility = false;
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [mockVersion_B.v2_2_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' })],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoB.v2_1_1({ strictVersion: true })],
      exposes: [],
    });

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    // dirty: false because dynamic init does not replace/remove existing versions
    // action: scope because an incompatible version already exists in cache
    // cached: true because this will be included in the importMap
    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-b',
      mockExternal.shared(
        [
          mockVersion_B.v2_2_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' }),
          mockVersion_B.v2_1_1({
            remotes: { 'team/mfe1': { cached: true, strictVersion: true } },
            action: 'scope',
          }),
        ],
        { dirty: false }
      ),
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-b': { action: 'scope', override: undefined },
    });
  });

  it('should throw an error when shared external with incompatible version and strictVersion and strict', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => false);
    config.strict.strictExternalCompatibility = true;
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [mockVersion_B.v2_2_2({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' })],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoB.v2_1_1({ strictVersion: true })],
      exposes: [],
    });

    await expect(updateCache(remoteEntry)).rejects.toThrow(`Could not process remote 'team/mfe1'`);
    expect(config.log.error).toHaveBeenCalledWith(
      8,
      "[__GLOBAL__][team/mfe1] dep-b@2.1.1 Is not compatible with existing dep-b@2.2.2 requiredRange '~2.2.0'"
    );
  });

  it('should handle duplicate versions of the same external', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [mockVersion_A.v2_1_1({ remotes: { 'team/mfe2': { cached: true } }, action: 'share' })],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoA.v2_1_1()],
      exposes: [],
    });

    const result = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [
          mockVersion_A.v2_1_1({
            remotes: { 'team/mfe2': { cached: true }, 'team/mfe1': { cached: false } },
            action: 'share',
          }),
        ],
        { dirty: false }
      ),
      undefined
    );

    expect(result.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
  });

  it('should warn users if the requiredVersions differ and strictVersion', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    config.strict.strictExternalCompatibility = false;
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [
              mockVersion_A.v2_1_1({
                remotes: { 'team/mfe2': { cached: true, requiredVersion: '~2.1.0' } },
                action: 'share',
              }),
            ],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoA.v2_1_1({ requiredVersion: '~2.1.1', strictVersion: true })],
      exposes: [],
    });

    const result = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [
          mockVersion_A.v2_1_1({
            remotes: {
              'team/mfe2': { cached: true, requiredVersion: '~2.1.0' },
              'team/mfe1': { cached: false, requiredVersion: '~2.1.1' },
            },
            action: 'share',
          }),
        ],
        { dirty: false }
      ),
      undefined
    );

    expect(result.actions).toEqual({
      'dep-a': { action: 'skip' },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      8,
      "[team/mfe1][dep-a@2.1.1] Required version '~2.1.1' does not match existing '~2.1.0'"
    );
  });

  it('should throw an error if the requiredVersions differs if strictVersion and in strict mode', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    config.strict.strictExternalCompatibility = true;
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [
              mockVersion_A.v2_1_1({
                remotes: { 'team/mfe2': { cached: true, requiredVersion: '~2.1.0' } },
                action: 'share',
              }),
            ],
            { dirty: false }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [mockSharedInfoA.v2_1_1({ requiredVersion: '~2.1.1', strictVersion: true })],
      exposes: [],
    });

    await expect(updateCache(remoteEntry)).rejects.toThrow("Could not process remote 'team/mfe1'");

    expect(config.log.error).toHaveBeenCalledWith(
      8,
      "[team/mfe1][dep-a@2.1.1] Required version '~2.1.1' does not match existing '~2.1.0'"
    );
  });

  it('should add the correct tag if missing', async () => {
    adapters.versionCheck.smallestVersion = jest.fn((): string => '2.2.1');

    adapters.sharedExternalsRepo.tryGet = jest.fn((): Optional<SharedExternal> => Optional.empty());

    const remoteEntry = mockRemoteEntry_MFE1({
      shared: [
        mockSharedInfo('dep-a', { version: undefined, singleton: true, requiredVersion: '~2.2.1' }),
      ],
      exposes: [],
    });

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [
          mockVersion.shared('2.2.1', 'dep-a', {
            remotes: {
              'team/mfe1': { cached: true, requiredVersion: '~2.2.1' },
            },
            action: 'share',
          }),
        ],
        { dirty: false }
      ),
      undefined
    );
    expect(actual.actions).toEqual({
      'dep-a': { action: 'share', override: undefined },
    });
    expect(config.log.warn).toHaveBeenCalledWith(
      8,
      "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
    );
  });

  it('should correctly order the the versions descending', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.versionCheck.compare = jest.fn((a, b) => {
      const order = ['2.1.3', '2.1.2', '2.1.1'];
      return order.indexOf(b) - order.indexOf(a);
    });
    adapters.sharedExternalsRepo.tryGet = jest.fn(
      (): Optional<SharedExternal> =>
        Optional.of(
          mockExternal.shared(
            [
              mockVersion_A.v2_1_1({ remotes: { 'team/mfe1': { cached: false } }, action: 'skip' }),
              mockVersion_A.v2_1_3({ remotes: { 'team/mfe3': { cached: true } }, action: 'share' }),
            ],
            {
              dirty: false,
            }
          )
        )
    );

    const remoteEntry = mockRemoteEntry_MFE2({
      exposes: [],
      shared: [mockSharedInfoA.v2_1_2()],
    });

    const actual = await updateCache(remoteEntry);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledTimes(1);

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal.shared(
        [
          mockVersion_A.v2_1_3({ remotes: { 'team/mfe3': { cached: true } }, action: 'share' }),
          mockVersion_A.v2_1_2({ remotes: { 'team/mfe2': { cached: false } }, action: 'skip' }),
          mockVersion_A.v2_1_1({ remotes: { 'team/mfe1': { cached: false } }, action: 'skip' }),
        ],
        { dirty: false }
      ),
      undefined
    );

    expect(actual.actions).toEqual({
      'dep-a': { action: 'skip', override: undefined },
    });
  });
});
