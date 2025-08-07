import { ForDeterminingSharedExternals } from '../../driver-ports/init/for-determining-shared-externals.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createDetermineSharedExternals } from './determine-shared-externals';
import { NFError } from 'lib/native-federation.error';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { ConfigContract } from 'lib/2.app/config';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockExternal_A, mockExternal_B } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion_A, mockVersion_B } from 'lib/6.mocks/domain/externals/version.mock';

describe('createDetermineSharedExternals', () => {
  let determineSharedExternals: ForDeterminingSharedExternals;
  let config: ConfigContract;
  let adapters: Pick<DrivingContract, 'versionCheck' | 'sharedExternalsRepo'>;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'global');

    determineSharedExternals = createDetermineSharedExternals(config, adapters);
  });

  describe("default scenario's", () => {
    it('should set available version to share', async () => {
      adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
        'dep-a': mockExternal_A({
          dirty: true,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/mfe1'], action: 'skip' })],
        }),
      }));

      await determineSharedExternals();

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-a',
        mockExternal_A({
          dirty: false,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/mfe1'], action: 'share' })],
        }),
        '__GLOBAL__'
      );
    });

    it('should skip if not dirty', async () => {
      adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
        'dep-a': mockExternal_A({
          dirty: false,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/mfe1'], action: 'skip' })],
        }),
      }));

      await determineSharedExternals();

      expect(adapters.sharedExternalsRepo.addOrUpdate).not.toHaveBeenCalled();
    });
  });

  describe('handle version incompatibilities', () => {
    it('should set "skip" if incompatible, strictVersion is false and in non-strict mode', async () => {
      config.strict = false;

      adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
        'dep-b': mockExternal_B({
          dirty: true,
          versions: [
            mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'skip' }),
            mockVersion_B.v2_1_1({
              remotes: { 'team/mfe2': { strictVersion: false } },
              action: 'skip',
            }),
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
            mockVersion_B.v2_1_1({
              remotes: { 'team/mfe2': { strictVersion: false } },
              action: 'skip',
            }),
          ],
        }),
        '__GLOBAL__'
      );
    });

    it('should set "scoped" if incompatible, strictVersion is true and in non-strict mode', async () => {
      config.strict = false;

      adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
        'dep-b': mockExternal_B({
          dirty: true,
          versions: [
            mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'skip' }),
            mockVersion_B.v2_1_1({
              remotes: { 'team/mfe2': { strictVersion: true } },
              action: 'skip',
            }),
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
            mockVersion_B.v2_1_1({
              remotes: { 'team/mfe2': { strictVersion: true } },
              action: 'scope',
            }),
          ],
        }),
        '__GLOBAL__'
      );
    });

    it('should throw error if incompatible, strictVersion is true and in strict mode', async () => {
      config.strict = true;

      adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
        'dep-b': mockExternal_B({
          dirty: true,
          versions: [
            mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'skip' }),
            mockVersion_B.v2_1_1({
              remotes: { 'team/mfe2': { strictVersion: true } },
              action: 'skip',
            }),
          ],
        }),
      }));

      await expect(determineSharedExternals()).rejects.toEqual(
        new NFError('Could not determine shared externals in scope __GLOBAL__.', expect.any(Error))
      );
    });
  });

  describe('Custom scope', () => {
    beforeEach(() => {
      adapters.sharedExternalsRepo.getScopes = jest.fn(() => ['custom-scope']);
      adapters.sharedExternalsRepo.scopeType = jest.fn(() => 'shareScope');
    });

    it('should set only one version to share when compatible, the rest to skip', async () => {
      adapters.versionCheck.isCompatible = jest.fn(() => true);
      adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
        'dep-b': mockExternal_B({
          dirty: true,
          versions: [
            mockVersion_B.v2_1_2({ remotes: ['team/mfe1'], action: 'skip' }),
            mockVersion_B.v2_1_1({ remotes: ['team/mfe2'], action: 'skip' }),
          ],
        }),
      }));

      await determineSharedExternals();

      expect(adapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
        'dep-b',
        mockExternal_B({
          dirty: false,
          versions: [
            mockVersion_B.v2_1_2({ remotes: ['team/mfe1'], action: 'share' }),
            mockVersion_B.v2_1_1({ remotes: ['team/mfe2'], action: 'skip' }),
          ],
        }),
        'custom-scope'
      );
    });
  });
});
