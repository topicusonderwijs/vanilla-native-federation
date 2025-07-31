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
import { Optional } from 'lib/utils/optional';

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
        skipCachedRemotesIfURLMatches: true,
      },
      hostRemoteEntry: false,
      strict: false,
    } as HostConfig & LoggingConfig & ModeConfig;

    mockAdapters = {
      remoteEntryProvider: mockRemoteEntryProvider(),
      remoteInfoRepo: mockRemoteInfoRepository(),
    };
    mockAdapters.remoteInfoRepo.tryGet = jest.fn(() => Optional.empty());

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
      mockAdapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe1'
      );
      expect(mockAdapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

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
        `Fetched remote 'team/mfe1' does not match requested 'team/mfe2'. Omitting expected name.`
      );

      expect(result.isPresent()).toBe(true);
      expect(result.get()!.name).toBe('team/mfe1');
      expect(result.get()!.url).toBe(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);
    });

    it('should reject if fetched remote name does not match requested name on strict mode', async () => {
      mockConfig.strict = true;
      await expect(
        getRemoteEntry(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`, 'team/mfe2')
      ).rejects.toThrow('Could not fetch remoteEntry.');

      expect(mockConfig.log.error).toHaveBeenCalledWith(
        7,
        `Fetched remote 'team/mfe1' does not match requested 'team/mfe2'.`
      );
    });
  });

  describe('skipping cached remotes', () => {
    it('should skip fetching remote if it exists in repository and skipCachedRemotes is never', async () => {
      mockConfig.profile.skipCachedRemotes = 'never';
      mockAdapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe1'
      );
      expect(mockAdapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(mockAdapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });

    it('should skip fetching remote if URL matches cached remote info', async () => {
      mockConfig.profile.skipCachedRemotesIfURLMatches = true;
      mockAdapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe1'
      );
      expect(mockAdapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(mockAdapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });
  });
});
