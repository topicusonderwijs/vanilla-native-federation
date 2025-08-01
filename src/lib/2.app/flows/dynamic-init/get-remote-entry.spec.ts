import { createGetRemoteEntry } from './get-remote-entry';
import { DrivingContract } from '../../driving-ports/driving.contract';
import {
  MOCK_REMOTE_ENTRY_I,
  MOCK_REMOTE_ENTRY_SCOPE_I_URL,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { ForGettingRemoteEntry } from 'lib/2.app/driver-ports/dynamic-init/for-getting-remote-entry.port';
import { Optional } from 'lib/utils/optional';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { NFError } from 'lib/native-federation.error';

describe('createGetRemoteEntry', () => {
  let getRemoteEntry: ForGettingRemoteEntry;
  let config: any;
  let adapters: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo'>;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.tryGet = jest.fn(() => Optional.empty());

    getRemoteEntry = createGetRemoteEntry(config, adapters);

    adapters.remoteEntryProvider.provide = jest.fn((from: string) =>
      Promise.resolve({ ...MOCK_REMOTE_ENTRY_I(), url: from })
    );
  });

  describe('fetching remote entry', () => {
    it('should fetch the given remoteEntry', async () => {
      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe1'
      );

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`
      );

      expect(result.get()).toEqual(MOCK_REMOTE_ENTRY_I());
    });

    it('should throw error if remoteEntryProvider fails', async () => {
      adapters.remoteEntryProvider.provide = jest.fn().mockRejectedValue(new Error('Fetch error'));

      await expect(
        getRemoteEntry(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`)
      ).rejects.toThrow('Could not fetch remoteEntry.');
    });

    it('should skip fetching remote if it exists in repository and skipCachedRemotes is always', async () => {
      config.profile.skipCachedRemotes = 'always';
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
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
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });

    it('should log a warning if fetched remote name does not match requested name', async () => {
      const result = await getRemoteEntry(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        'team/mfe2'
      );

      expect(config.log.warn).toHaveBeenCalledWith(
        7,
        `Fetched remote 'team/mfe1' does not match requested 'team/mfe2'. Omitting expected name.`
      );

      expect(result.isPresent()).toBe(true);
      expect(result.get()!.name).toBe('team/mfe1');
      expect(result.get()!.url).toBe(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);
    });

    it('should reject if fetched remote name does not match requested name on strict mode', async () => {
      config.strict = true;
      await expect(
        getRemoteEntry(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`, 'team/mfe2')
      ).rejects.toThrow('Could not fetch remoteEntry.');

      expect(config.log.error).toHaveBeenCalledWith(
        7,
        '[team/mfe2] Could not fetch remoteEntry from http://my.service/mfe1/remoteEntry.json.',
        new NFError("Fetched remote 'team/mfe1' does not match requested 'team/mfe2'.")
      );
    });
  });

  describe('skipping cached remotes', () => {
    it('should skip fetching remote if it exists in repository and skipCachedRemotes is never', async () => {
      config.profile.skipCachedRemotes = 'never';
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
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
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });

    it('should skip fetching remote if URL matches cached remote info', async () => {
      config.profile.skipCachedRemotesIfURLMatches = true;
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
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
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });
  });

  describe('overriding existing remote info', () => {
    it('should mark remote as overridden if it exists in repository', async () => {
      adapters.remoteInfoRepo.contains = jest.fn(() => true);
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: `http://legacy.url/remoteEntry.json`,
          exposes: [],
        })
      );
      const result = await getRemoteEntry(`http://override.url/remoteEntry.json`, 'team/mfe1');

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `http://override.url/remoteEntry.json`
      );

      expect(result.get()).toEqual({
        ...MOCK_REMOTE_ENTRY_I(),
        url: 'http://override.url/remoteEntry.json',
        override: true,
      });
      expect(config.log.debug).toHaveBeenCalledWith(
        7,
        `Overriding existing remote 'team/mfe1' with 'http://override.url/remoteEntry.json'.`
      );
    });
  });
});
