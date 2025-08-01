import { createGetRemoteEntries } from './get-remote-entries';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { ForGettingRemoteEntries } from '../../driver-ports/init/for-getting-remote-entries.port';
import { MOCK_MANIFEST } from 'lib/6.mocks/domain/manifest.mock';
import {
  MOCK_HOST_REMOTE_ENTRY,
  MOCK_HOST_REMOTE_ENTRY_SCOPE_URL,
  MOCK_REMOTE_ENTRY_I,
  MOCK_REMOTE_ENTRY_II,
  MOCK_REMOTE_ENTRY_SCOPE_I_URL,
  MOCK_REMOTE_ENTRY_SCOPE_II_URL,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { NFError } from 'lib/native-federation.error';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';

describe('createGetRemoteEntries', () => {
  let getRemoteEntries: ForGettingRemoteEntries;
  let config: any;
  let adapters: Pick<
    DrivingContract,
    'remoteEntryProvider' | 'manifestProvider' | 'remoteInfoRepo'
  >;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.tryGet = jest.fn(_ => {
      return Optional.empty<RemoteInfo>();
    });

    adapters.remoteEntryProvider.provide = jest.fn((url: string) => {
      if (url === `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`) {
        return Promise.resolve(MOCK_REMOTE_ENTRY_I());
      }
      if (url === `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`) {
        return Promise.resolve(MOCK_REMOTE_ENTRY_II());
      }
      return Promise.reject(new NFError(`Fetch of '${url}' returned 404 Not Found`));
    });

    getRemoteEntries = createGetRemoteEntries(config, adapters);
  });

  describe('fetching remote entries', () => {
    it('should fetch remote entries when given a manifest', async () => {
      const actual = await getRemoteEntries(MOCK_MANIFEST());

      expect(adapters.manifestProvider.provide).toHaveBeenCalledWith(MOCK_MANIFEST());
      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`
      );
      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`
      );

      expect(actual).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II()]);
    });

    it('should use empty manifest when no argument is provided', async () => {
      await getRemoteEntries(undefined as any);
      expect(adapters.manifestProvider.provide).toHaveBeenCalledWith({});
    });

    it('should log debug messages when remotes are fetched', async () => {
      await getRemoteEntries(MOCK_MANIFEST());

      expect(config.log.debug).toHaveBeenNthCalledWith(
        1,
        1,
        `Fetched 'team/mfe1' from 'http://my.service/mfe1/remoteEntry.json', exposing: [{"key":"./wc-comp-a","outFileName":"component-a.js"}]`
      );

      expect(config.log.debug).toHaveBeenNthCalledWith(
        2,
        1,
        `Fetched 'team/mfe2' from 'http://my.service/mfe2/remoteEntry.json', exposing: [{"key":"./wc-comp-b","outFileName":"component-b.js"},{"key":"./wc-comp-c","outFileName":"component-c.js"}]`
      );
    });

    it('should fetch manifest from URL when given a string', async () => {
      const manifestUrl = 'http://my.service/manifest.json';

      const actual = await getRemoteEntries(manifestUrl);

      expect(adapters.manifestProvider.provide).toHaveBeenCalledWith(manifestUrl);

      expect(actual).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II()]);
    });
  });

  describe('inclusion of host remoteEntry', () => {
    beforeEach(() => {
      adapters.remoteEntryProvider.provide = jest.fn((url: string) => {
        if (url.startsWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`)) {
          return Promise.resolve(MOCK_HOST_REMOTE_ENTRY());
        }
        if (url === `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`) {
          return Promise.resolve(MOCK_REMOTE_ENTRY_I());
        }
        if (url === `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`) {
          return Promise.resolve(MOCK_REMOTE_ENTRY_II());
        }
        return Promise.reject(new NFError(`Fetch of '${url}' returned 404 Not Found`));
      });
    });

    it('should process hostRemoteEntry if defined in config', async () => {
      config.hostRemoteEntry = {
        name: 'host',
        url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`,
      };
      const actual = await getRemoteEntries(MOCK_MANIFEST());

      expect(actual).toEqual([
        MOCK_REMOTE_ENTRY_I(),
        MOCK_REMOTE_ENTRY_II(),
        MOCK_HOST_REMOTE_ENTRY(),
      ]);
      expect(actual[0]!.host).toBeUndefined();
      expect(actual[1]!.host).toBeUndefined();
      expect(actual[2]!.host).toBe(true);
    });

    it('should add a cacheTag if defined in config', async () => {
      config.hostRemoteEntry = {
        name: 'host',
        url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`,
        cacheTag: '123abc',
      };
      const actual = await getRemoteEntries(MOCK_MANIFEST());

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json?cacheTag=123abc`
      );

      expect(actual).toEqual([
        MOCK_REMOTE_ENTRY_I(),
        MOCK_REMOTE_ENTRY_II(),
        MOCK_HOST_REMOTE_ENTRY(),
      ]);
    });

    it('should rename host remoteName to config defined name', async () => {
      config.hostRemoteEntry = {
        name: 'newHostName',
        url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`,
      };
      const actual = await getRemoteEntries({});

      expect(actual).toEqual([{ ...MOCK_HOST_REMOTE_ENTRY(), name: 'newHostName' }]);
    });
  });

  describe('handling existing remotes', () => {
    it('should not skip fetching remotes that exist in the repository when disabled in config', async () => {
      config.profile.skipCachedRemotes = 'never';
      config.profile.skipCachedRemotesIfURLMatches = false;

      // Setup storage to contain one of the remotes
      adapters.remoteInfoRepo.tryGet = jest
        .fn()
        .mockImplementation(_ =>
          Optional.of({ scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(), exposes: [] })
        );

      const actual = await getRemoteEntries(MOCK_MANIFEST());

      expect(actual).toEqual([
        { ...MOCK_REMOTE_ENTRY_I(), override: true },
        { ...MOCK_REMOTE_ENTRY_II(), override: true },
      ]);
    });

    it('should skip fetching same-url remotes that exist in the repository when enabled in config', async () => {
      config.profile.skipCachedRemotes = 'never';
      config.profile.skipCachedRemotesIfURLMatches = true;

      // Setup storage to contain one of the remotes
      adapters.remoteInfoRepo.tryGet = jest
        .fn()
        .mockImplementation(_ =>
          Optional.of({ scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(), exposes: [] })
        );

      const actual = await getRemoteEntries(MOCK_MANIFEST());

      expect(actual).toEqual([{ ...MOCK_REMOTE_ENTRY_II(), override: true }]);
    });

    it('should skip fetching remotes that exist in the repository when enabled in config', async () => {
      config.profile.skipCachedRemotes = 'always';

      adapters.remoteInfoRepo.tryGet = jest.fn().mockImplementation(remote => {
        if (remote === 'team/mfe1')
          return Optional.of({ scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(), exposes: [] });
        return Optional.empty();
      });

      const actual = await getRemoteEntries(MOCK_MANIFEST());
      expect(actual).toEqual([MOCK_REMOTE_ENTRY_II()]);

      expect(config.log.debug).toHaveBeenCalledWith(
        1,
        "Found remote 'team/mfe1' in storage, omitting fetch."
      );
    });
  });

  describe('error handling', () => {
    it('should handle failed remote fetch in non-strict mode', async () => {
      config.strict = false;
      adapters.remoteEntryProvider.provide = jest.fn(url => {
        if (url === `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`) {
          return Promise.resolve(MOCK_REMOTE_ENTRY_I());
        }

        // remote 2
        return Promise.reject(new NFError(`Failed to fetch remoteEntry from ${url}`));
      });

      const actual = await getRemoteEntries(MOCK_MANIFEST());

      expect(actual).toEqual([MOCK_REMOTE_ENTRY_I()]);

      expect(config.log.warn).toHaveBeenCalledWith(
        1,
        "Could not fetch remote 'team/mfe2'. skipping init.",
        expect.any(NFError)
      );
    });

    it('should throw error when remote fetch fails in strict mode', async () => {
      config.strict = true;

      adapters.remoteEntryProvider.provide = jest.fn(url => {
        if (url === `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`) {
          return Promise.resolve(MOCK_REMOTE_ENTRY_II());
        }
        return Promise.reject(new NFError(`Failed to fetch remoteEntry from ${url}`));
      });

      await expect(getRemoteEntries(MOCK_MANIFEST())).rejects.toEqual(
        new NFError("Could not fetch remote 'team/mfe1'")
      );

      expect(config.log.error).toHaveBeenCalledWith(
        1,
        "Could not fetch remote 'team/mfe1'.",
        expect.any(NFError)
      );
    });

    it('should throw error when manifest provider fails', async () => {
      adapters.manifestProvider.provide = jest
        .fn()
        .mockRejectedValue(new NFError('Failed to fetch manifest'));

      await expect(getRemoteEntries('http://bad.manifest.url')).rejects.toEqual(
        new NFError('Failed to fetch manifest')
      );

      expect(config.log.error).toHaveBeenCalledWith(
        1,
        'Could not fetch manifest.',
        expect.any(NFError)
      );
    });

    it('should warn when remote entry name does not match requested name', async () => {
      const manifestWithBadEntryName = {
        'bad-mfe-name': `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
      };

      await getRemoteEntries(manifestWithBadEntryName);

      expect(config.log.warn).toHaveBeenCalledWith(
        1,
        "Fetched remote 'team/mfe1' does not match requested 'bad-mfe-name'. Omitting expected name."
      );
    });

    it('should throw an error when remote entry name does not match requested name on strict mode', () => {
      config.strict = true;
      const manifestWithBadEntryName = {
        'bad-mfe-name': `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
      };

      expect(getRemoteEntries(manifestWithBadEntryName)).rejects.toEqual(
        new NFError("Could not fetch remote 'bad-mfe-name'")
      );
    });
  });
});
