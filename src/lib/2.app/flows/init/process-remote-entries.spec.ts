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
import { mockScopeUrl_MFE1 } from 'lib/6.mocks/domain/scope-url.mock';
import { mockRemoteModuleA } from 'lib/6.mocks/domain/remote-info/remote-module.mock';
import { mockSharedInfo } from 'lib/6.mocks/domain/remote-entry/shared-info.mock';

describe('createProcessRemoteEntries', () => {
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

  describe('cleaning up before processing', () => {
    it('should remove the previous cached version if remoteEntry is marked as override', async () => {
      const remoteEntries = [mockRemoteEntry_MFE1({ override: true })];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(adapters.scopedExternalsRepo.remove).toHaveBeenCalledWith('team/mfe1');
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).toHaveBeenCalledWith('team/mfe1');
    });

    it('should not remove the old version if the remoteEntry is not marked as override', async () => {
      const remoteEntries = [mockRemoteEntry_MFE1({ override: false })];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(adapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
    });

    it('should not remove the old version if the remoteEntry is missing the override flag', async () => {
      const remoteEntries = [mockRemoteEntry_MFE1({ override: undefined })];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.remove).not.toHaveBeenCalled();
      expect(adapters.scopedExternalsRepo.remove).not.toHaveBeenCalled();
      expect(adapters.sharedExternalsRepo.removeFromAllScopes).not.toHaveBeenCalled();
    });
  });

  describe('process remote infos', () => {
    it('should process remote entries and add them to repositories', async () => {
      const remoteEntries = [mockRemoteEntry_MFE1()];

      await processRemoteEntries(remoteEntries);

      expect(adapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledTimes(1);
      expect(adapters.remoteInfoRepo.addOrUpdate).toHaveBeenCalledWith('team/mfe1', {
        scopeUrl: mockScopeUrl_MFE1(),
        exposes: [mockRemoteModuleA()],
      });
    });
  });

  describe('handling a missing version property', () => {
    it('should handle invalid versions in strict mode', async () => {
      config.strict.strictExternalVersion = true;
      adapters.versionCheck.isValidSemver = jest.fn(() => false);

      const remoteEntries = [
        mockRemoteEntry_MFE1({
          shared: [
            mockSharedInfo('dep-a', { version: 'invalid-version', requiredVersion: '~1.2.1' }),
          ],
        }),
      ];
      await expect(processRemoteEntries(remoteEntries)).rejects.toThrow(
        "Could not process remote 'team/mfe1'"
      );
      expect(config.log.error).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'invalid-version' is not a valid version."
      );
    });

    it('should handle undefined versions in strict mode', async () => {
      config.strict.strictExternalVersion = true;
      adapters.versionCheck.isValidSemver = jest.fn(() => false);

      const remoteEntries = [
        mockRemoteEntry_MFE1({
          shared: [mockSharedInfo('dep-a', { version: undefined, requiredVersion: '~1.2.1' })],
        }),
      ];
      await expect(processRemoteEntries(remoteEntries)).rejects.toThrow(
        "Could not process remote 'team/mfe1'"
      );
      expect(config.log.error).toHaveBeenCalledWith(
        2,
        "[team/mfe1][dep-a] Version 'undefined' is not a valid version."
      );
    });
  });
});
