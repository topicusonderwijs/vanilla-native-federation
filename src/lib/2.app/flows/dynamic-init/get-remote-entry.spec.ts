import { createGetRemoteEntry } from './get-remote-entry';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { ForGettingRemoteEntry } from 'lib/2.app/driver-ports/dynamic-init/for-getting-remote-entry.port';
import { Optional } from 'lib/utils/optional';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { NFError } from 'lib/native-federation.error';
import { mockRemoteEntry_MFE1 } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { mockScopeUrl_MFE1 } from 'lib/6.mocks/domain/scope-url.mock';

describe('createGetRemoteEntry', () => {
  let getRemoteEntry: ForGettingRemoteEntry;
  let config: any;
  let adapters: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo'>;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.tryGet = jest.fn(() => Optional.empty());

    getRemoteEntry = createGetRemoteEntry(config, adapters);

    adapters.remoteEntryProvider.provide = jest.fn((url: string) => {
      if (url.startsWith(mockScopeUrl_MFE1())) {
        return Promise.resolve({ ...mockRemoteEntry_MFE1(), url });
      }
      return Promise.reject(new NFError(`Fetch of '${url}' returned 404 Not Found`));
    });
  });

  describe('fetching remote entry', () => {
    it('should fetch the given remoteEntry', async () => {
      const result = await getRemoteEntry(`${mockScopeUrl_MFE1()}remoteEntry.json`, 'team/mfe1');

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        mockScopeUrl_MFE1({ file: 'remoteEntry.json' })
      );

      expect(result.get()).toEqual(mockRemoteEntry_MFE1());
    });

    it('should throw error if remoteEntryProvider fails', async () => {
      adapters.remoteEntryProvider.provide = jest.fn().mockRejectedValue(new Error('Fetch error'));

      await expect(
        getRemoteEntry(mockScopeUrl_MFE1({ file: 'remoteEntry.json' }), 'team/mfe1')
      ).rejects.toThrow('Could not fetch remoteEntry.');
    });

    it('should skip fetching remote if it exists in repository and overrideCachedRemotes is never', async () => {
      config.profile.overrideCachedRemotes = 'never';
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: mockScopeUrl_MFE1(),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ file: 'remoteEntry.json' }),
        'team/mfe1'
      );
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toBe(false);
    });

    it('should log a warning if fetched remote name does not match requested name', async () => {
      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ file: 'remoteEntry.json' }),
        'team/mfe2'
      );

      expect(config.log.warn).toHaveBeenCalledWith(
        7,
        `Fetched remote 'team/mfe1' does not match requested 'team/mfe2'. Omitting expected name.`
      );

      expect(result.isPresent()).toBe(true);
      expect(result.get()!.name).toBe('team/mfe1');
      expect(result.get()!.url).toBe(mockScopeUrl_MFE1({ file: 'remoteEntry.json' }));
    });

    it('should reject if fetched remote name does not match requested name on strict mode', async () => {
      config.strict = true;
      await expect(
        getRemoteEntry(mockScopeUrl_MFE1({ file: 'remoteEntry.json' }), 'team/mfe2')
      ).rejects.toThrow('Could not fetch remoteEntry.');

      expect(config.log.error).toHaveBeenCalledWith(
        7,
        '[team/mfe2] Could not fetch remoteEntry from http://my.service/mfe1/remoteEntry.json.',
        new NFError("Fetched remote 'team/mfe1' does not match requested 'team/mfe2'.")
      );
    });
  });

  describe('overriding cached remotes', () => {
    it('should override fetching remote if it exists in repository and overrideCachedRemotes is always', async () => {
      config.profile.overrideCachedRemotes = 'always';
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' }),
        'team/mfe1'
      );
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })
      );

      expect(result.isPresent()).toEqual(true);
    });

    it('should not override fetching remote if it exists in repository and overrideCachedRemotes is init-only', async () => {
      config.profile.overrideCachedRemotes = 'init-only';
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' }),
        'team/mfe1'
      );
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toEqual(false);
    });

    it('should not override fetching remote if it exists in repository and overrideCachedRemotes is never', async () => {
      config.profile.overrideCachedRemotes = 'never';
      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' }),
        'team/mfe1'
      );
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toEqual(false);
    });

    it('should skip fetching remote if URL matches cached remote info', async () => {
      config.profile.overrideCachedRemotes = 'always';
      config.profile.overrideCachedRemotesIfURLMatches = false;

      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ folder: 'v1', file: 'remoteEntry.json' }),
        'team/mfe1'
      );
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();

      expect(result.isPresent()).toEqual(false);
    });

    it('should override remote if URL matches cached remote info and enabled in config', async () => {
      config.profile.overrideCachedRemotes = 'always';
      config.profile.overrideCachedRemotesIfURLMatches = true;
      adapters.remoteInfoRepo.contains = jest.fn(() => true);

      adapters.remoteInfoRepo.tryGet = jest.fn(() =>
        Optional.of({
          name: 'team/mfe1',
          scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }),
          exposes: [],
        })
      );

      const result = await getRemoteEntry(
        mockScopeUrl_MFE1({ folder: 'v1', file: 'remoteEntry.json' }),
        'team/mfe1'
      );
      expect(adapters.remoteInfoRepo.tryGet).toHaveBeenCalledWith('team/mfe1');

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        mockScopeUrl_MFE1({ folder: 'v1', file: 'remoteEntry.json' })
      );

      expect(result.isPresent()).toEqual(true);
      expect(result.get()).toEqual({
        ...mockRemoteEntry_MFE1(),
        url: mockScopeUrl_MFE1({ folder: 'v1', file: 'remoteEntry.json' }),
        override: true,
      });
    });
  });
});
