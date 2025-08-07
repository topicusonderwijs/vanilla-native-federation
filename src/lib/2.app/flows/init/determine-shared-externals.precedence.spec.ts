import { ForDeterminingSharedExternals } from '../../driver-ports/init/for-determining-shared-externals.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createDetermineSharedExternals } from './determine-shared-externals';
import { GLOBAL_SCOPE } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { mockExternal_A, mockExternal_B } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion_A, mockVersion_B } from 'lib/6.mocks/domain/externals/version.mock';

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
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: true,
        versions: [
          mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' }),
          mockVersion_A.v2_1_1({ remotes: { 'team/host': { host: true } }, action: 'skip' }),
        ],
      }),
    }));

    await determineSharedExternals();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' }),
          mockVersion_A.v2_1_1({ remotes: { 'team/host': { host: true } }, action: 'share' }),
        ],
      }),
      GLOBAL_SCOPE
    );
  });

  it('should share the latest version if all equal', async () => {
    adapters.versionCheck.isCompatible = jest.fn(() => true);
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: true,
        versions: [
          mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' }),
          mockVersion_A.v2_1_1({ remotes: ['team/mfe2'], action: 'skip' }),
        ],
      }),
    }));

    await determineSharedExternals();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-a',
      mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_2({ remotes: ['team/mfe1'], action: 'share' }),
          mockVersion_A.v2_1_1({ remotes: ['team/mfe2'], action: 'skip' }),
        ],
      }),
      GLOBAL_SCOPE
    );
  });

  it('Should choose latest most compatible version if no host version available', async () => {
    adapters.versionCheck.isCompatible = jest.fn(
      (v, range) => v.substring(0, 3) === range.substring(1, 4) // '(x.x).x' === '~(x.x).x'
    );
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-b': mockExternal_B({
        dirty: true,
        versions: [
          mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'skip' }),
          mockVersion_B.v2_1_2({ remotes: ['team/mfe2'], action: 'skip' }),
          mockVersion_B.v2_1_1({ remotes: ['team/mfe3'], action: 'skip' }),
        ],
      }),
    }));

    await determineSharedExternals();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-b',
      mockExternal_B({
        dirty: false,
        versions: [
          mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'scope' }),
          mockVersion_B.v2_1_2({ remotes: ['team/mfe2'], action: 'share' }),
          mockVersion_B.v2_1_1({ remotes: ['team/mfe3'], action: 'skip' }),
        ],
      }),
      GLOBAL_SCOPE
    );
  });

  it('Should prioritize latest version if config is enabled', async () => {
    config.profile.latestSharedExternal = true;

    adapters.versionCheck.isCompatible = jest.fn(
      (v, range) => v.substring(0, 3) === range.substring(1, 4) // '(x.x).x' === '~(x.x).x'
    );
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-b': mockExternal_B({
        dirty: true,
        versions: [
          mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'skip' }),
          mockVersion_B.v2_1_2({ remotes: ['team/mfe2'], action: 'skip' }),
          mockVersion_B.v2_1_1({ remotes: ['team/mfe3'], action: 'skip' }),
        ],
      }),
    }));

    await determineSharedExternals();

    expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
      'dep-b',
      mockExternal_B({
        dirty: false,
        versions: [
          mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'share' }),
          mockVersion_B.v2_1_2({ remotes: ['team/mfe2'], action: 'scope' }),
          mockVersion_B.v2_1_1({ remotes: ['team/mfe3'], action: 'scope' }),
        ],
      }),
      GLOBAL_SCOPE
    );
  });
});
