import { createExternalsAudit } from './externals-audit';
import { NFError } from 'lib/native-federation.error';
import { LoggingConfig, ModeConfig } from '../../config';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { RemoteEntry } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { mockRemoteEntry_MFE1 } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { mockSharedInfo } from 'lib/6.mocks/domain/remote-entry/shared-info.mock';
import { mockExternal_A, mockExternal_B } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion_A, mockVersion_B } from 'lib/6.mocks/domain/externals/version.mock';

describe('createExternalsAudit', () => {
  let externalsAudit: (remoteEntry: RemoteEntry, strictVersion: boolean) => Promise<void>;
  let config: LoggingConfig & ModeConfig;
  let ports: Pick<DrivingContract, 'versionCheck' | 'sharedExternalsRepo' | 'scopedExternalsRepo'>;

  beforeEach(() => {
    config = mockConfig();
    ports = mockAdapters();

    externalsAudit = createExternalsAudit(config, ports);

    ports.sharedExternalsRepo.getScopes = jest.fn(() => ['__GLOBAL__']);
    ports.sharedExternalsRepo.getFromScope = jest.fn(() => ({}));
    ports.versionCheck.isCompatible = jest.fn(() => false);
    ports.versionCheck.compare = jest.fn(() => 0);
  });

  describe('successful audit scenarios', () => {
    it('should resolve when all externals pass audit checks', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [
          mockSharedInfo('dep-a', {
            singleton: false,
            requiredVersion: '~1.0.0',
          }),
        ],
      });

      await expect(externalsAudit(remoteEntry, false)).resolves.toBeUndefined();
    });

    it('should resolve when no externals are shared', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [],
      });

      await expect(externalsAudit(remoteEntry, true)).resolves.toBeUndefined();
    });
  });

  describe('audit: external could be singleton but is scoped instead', () => {
    it('should warn when non-singleton external is compatible with shared version', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [
          mockSharedInfo('dep-a', {
            singleton: false,
            requiredVersion: '~2.1.0',
          }),
        ],
      });

      (ports.sharedExternalsRepo.getFromScope as jest.Mock).mockReturnValue({
        'dep-a': mockExternal_A({
          dirty: false,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/other-mfe'], action: 'share' })],
        }),
      });
      (ports.versionCheck.isCompatible as jest.Mock).mockReturnValue(true);

      await expect(externalsAudit(remoteEntry, false)).resolves.toBeUndefined();

      expect(config.log.warn).toHaveBeenCalledWith(
        3,
        "[team/mfe1][scoped][__GLOBAL__][dep-a] External is compatible with shared range '~2.1.0'. Should be 'singleton: true'"
      );
    });

    it('should not warn when non-singleton external is not compatible', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [
          mockSharedInfo('dep-a', {
            singleton: false,
            requiredVersion: '~2.0.0',
          }),
        ],
      });

      (ports.sharedExternalsRepo.getFromScope as jest.Mock).mockReturnValue({
        'dep-a': mockExternal_A({
          dirty: false,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/other-mfe'], action: 'share' })],
        }),
      });
      (ports.versionCheck.isCompatible as jest.Mock).mockReturnValue(false);

      await expect(externalsAudit(remoteEntry, false)).resolves.toBeUndefined();

      expect(config.log.warn).not.toHaveBeenCalled();
    });
  });

  describe('audit: external should be scoped but is singleton instead', () => {
    it('should warn when scoped external is older than shared version', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [],
      });

      (ports.sharedExternalsRepo.getFromScope as jest.Mock).mockReturnValue({
        'dep-b': mockExternal_B({
          dirty: false,
          versions: [
            mockVersion_B.v2_1_1({ remotes: ['team/mfe1'], action: 'scope' }),
            mockVersion_B.v2_2_2({ remotes: ['team/other-mfe'], action: 'share' }),
          ],
        }),
      });
      (ports.versionCheck.compare as jest.Mock).mockReturnValue(-1);

      await expect(externalsAudit(remoteEntry, false)).resolves.toBeUndefined();

      expect(config.log.warn).toHaveBeenCalledWith(
        3,
        "[team/mfe1][shared][__GLOBAL__][dep-b@2.1.1] External is older than shared compatible range '~2.2.0'. Should be 'singleton: false'"
      );
    });

    it('should warn when scoped external is newer than shared version', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [],
      });

      (ports.sharedExternalsRepo.getFromScope as jest.Mock).mockReturnValue({
        'dep-b': mockExternal_B({
          dirty: false,
          versions: [
            mockVersion_B.v2_2_2({ remotes: ['team/mfe1'], action: 'scope' }),
            mockVersion_B.v2_1_1({ remotes: ['team/other-mfe'], action: 'share' }),
          ],
        }),
      });
      (ports.versionCheck.compare as jest.Mock).mockReturnValue(1);

      await expect(externalsAudit(remoteEntry, false)).resolves.toBeUndefined();

      expect(config.log.warn).toHaveBeenCalledWith(
        3,
        "[team/mfe1][shared][__GLOBAL__][dep-b@2.2.2] External is newer than shared compatible range '~2.1.0'."
      );
    });
  });

  describe('strict mode error handling', () => {
    it('should reject with NFError when audit fails in strict mode', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [
          mockSharedInfo('dep-a', {
            singleton: false,
            requiredVersion: '~2.1.0',
          }),
        ],
      });

      (ports.sharedExternalsRepo.getFromScope as jest.Mock).mockReturnValue({
        'dep-a': mockExternal_A({
          dirty: false,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/other-mfe'], action: 'share' })],
        }),
      });
      (ports.versionCheck.isCompatible as jest.Mock).mockReturnValue(true);

      await expect(externalsAudit(remoteEntry, true)).rejects.toEqual(
        new NFError('Failed externals audit')
      );

      expect(config.log.error).toHaveBeenCalledWith(
        3,
        '[team/mfe1] Not all externals are compatible.'
      );
    });

    it('should not reject in non-strict mode even when warnings occur', async () => {
      const remoteEntry = mockRemoteEntry_MFE1({
        shared: [
          mockSharedInfo('dep-a', {
            singleton: false,
            requiredVersion: '~2.1.0',
          }),
        ],
      });

      (ports.sharedExternalsRepo.getFromScope as jest.Mock).mockReturnValue({
        'dep-a': mockExternal_A({
          dirty: false,
          versions: [mockVersion_A.v2_1_1({ remotes: ['team/other-mfe'], action: 'share' })],
        }),
      });
      (ports.versionCheck.isCompatible as jest.Mock).mockReturnValue(true);

      await expect(externalsAudit(remoteEntry, false)).resolves.toBeUndefined();

      expect(config.log.warn).toHaveBeenCalled();
      expect(config.log.error).not.toHaveBeenCalled();
    });
  });
});
