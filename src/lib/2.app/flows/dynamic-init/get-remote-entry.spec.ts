import { createGetRemoteEntry } from './get-remote-entry';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { mockRemoteEntryProvider } from 'lib/6.mocks/adapters/remote-entry-provider.mock';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import {
  MOCK_REMOTE_ENTRY_I,
  MOCK_REMOTE_ENTRY_SCOPE_I_URL,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { HostConfig } from '../../config/host.contract';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { ForGettingRemoteEntry } from 'lib/2.app/driver-ports/dynamic-init/for-getting-remote-entry.port';

describe('createGetRemoteEntry', () => {
  let getRemoteEntry: ForGettingRemoteEntry;
  let mockConfig: any;
  let mockAdapters: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo'>;

  beforeEach(() => {
    mockConfig = {
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        level: 'debug',
      },
      profile: {
        latestSharedExternal: false,
        skipCachedRemotes: 'never',
      },
      hostRemoteEntry: false,
      strict: false,
    } as HostConfig & LoggingConfig & ModeConfig;

    mockAdapters = {
      remoteEntryProvider: mockRemoteEntryProvider(),
      remoteInfoRepo: mockRemoteInfoRepository(),
    };

    getRemoteEntry = createGetRemoteEntry(mockConfig, mockAdapters);
  });

  describe('fetching remote entry', () => {
    it('should fetch the given remoteEntry', async () => {
      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe1'
      );

      expect(mockAdapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`
      );

      expect(result.get()).toEqual(MOCK_REMOTE_ENTRY_I());
    });

    it('should throw error if remoteEntryProvider fails', async () => {
      mockAdapters.remoteEntryProvider.provide = jest
        .fn()
        .mockRejectedValue(new Error('Fetch error'));

      await expect(
        getRemoteEntry(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`)
      ).rejects.toThrow('Could not fetch remoteEntry.');
    });

    it('should skip fetching remote if it exists in repository and skipCachedRemotes is always', async () => {
      mockConfig.profile.skipCachedRemotes = 'always';
      mockAdapters.remoteInfoRepo.contains = jest.fn().mockReturnValue(true);

      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe1'
      );
      expect(mockAdapters.remoteInfoRepo.contains).toHaveBeenCalledWith('team/mfe1');

      expect(mockAdapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });

    it('should log a warning if fetched remote name does not match requested name', async () => {
      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe2'
      );

      expect(mockConfig.log.warn).toHaveBeenCalledWith(
        7,
        `remoteEntry '${result.get()?.name}' Does not match expected 'team/mfe2'.`
      );
    });
  });
});
