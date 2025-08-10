import { createGetRemoteEntries } from './get-remote-entries';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { ForGettingRemoteEntries } from '../../driver-ports/init/for-getting-remote-entries.port';
import { mockManifest } from 'lib/6.mocks/domain/manifest.mock';
import { NFError } from 'lib/native-federation.error';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockScopeUrl_HOST,
  mockScopeUrl_MFE1,
  mockScopeUrl_MFE2,
} from 'lib/6.mocks/domain/scope-url.mock';
import {
  mockRemoteEntry_HOST,
  mockRemoteEntry_MFE1,
  mockRemoteEntry_MFE2,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';

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
      if (url.startsWith(mockScopeUrl_MFE1())) {
        return Promise.resolve(mockRemoteEntry_MFE1());
      }
      if (url.startsWith(mockScopeUrl_MFE2())) {
        return Promise.resolve(mockRemoteEntry_MFE2());
      }
      return Promise.reject(new NFError(`Fetch of '${url}' returned 404 Not Found`));
    });

    getRemoteEntries = createGetRemoteEntries(config, adapters);
  });

  describe('fetching remote entries', () => {
    it('should fetch remote entries when given a manifest', async () => {
      const actual = await getRemoteEntries(mockManifest());

      expect(adapters.manifestProvider.provide).toHaveBeenCalledWith(mockManifest());
      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${mockScopeUrl_MFE1()}remoteEntry.json`
      );
      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${mockScopeUrl_MFE2()}remoteEntry.json`
      );

      expect(actual).toEqual([mockRemoteEntry_MFE1(), mockRemoteEntry_MFE2()]);
    });

    it('should use empty manifest when no argument is provided', async () => {
      await getRemoteEntries(undefined as any);
      expect(adapters.manifestProvider.provide).toHaveBeenCalledWith({});
    });

    it('should log debug messages when remotes are fetched', async () => {
      await getRemoteEntries(mockManifest());

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

      expect(actual).toEqual([mockRemoteEntry_MFE1(), mockRemoteEntry_MFE2()]);
    });
  });

  describe('inclusion of host remoteEntry', () => {
    beforeEach(() => {
      adapters.remoteEntryProvider.provide = jest.fn((url: string) => {
        if (url.startsWith(`${mockScopeUrl_HOST()}remoteEntry.json`)) {
          return Promise.resolve(mockRemoteEntry_HOST());
        }
        if (url === `${mockScopeUrl_MFE1()}remoteEntry.json`) {
          return Promise.resolve(mockRemoteEntry_MFE1());
        }
        if (url === `${mockScopeUrl_MFE2()}remoteEntry.json`) {
          return Promise.resolve(mockRemoteEntry_MFE2());
        }
        return Promise.reject(new NFError(`Fetch of '${url}' returned 404 Not Found`));
      });
    });

    it('should process hostRemoteEntry if defined in config', async () => {
      config.hostRemoteEntry = {
        name: 'team/host',
        url: `${mockScopeUrl_HOST()}remoteEntry.json`,
      };
      const actual = await getRemoteEntries(mockManifest());

      expect(actual).toEqual([
        mockRemoteEntry_MFE1(),
        mockRemoteEntry_MFE2(),
        mockRemoteEntry_HOST(),
      ]);
      expect(actual[0]!.host).toBeUndefined();
      expect(actual[1]!.host).toBeUndefined();
      expect(actual[2]!.host).toBe(true);
    });

    it('should add a cacheTag if defined in config', async () => {
      config.hostRemoteEntry = {
        name: 'team/host',
        url: `${mockScopeUrl_HOST()}remoteEntry.json`,
        cacheTag: '123abc',
      };
      const actual = await getRemoteEntries(mockManifest());

      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${mockScopeUrl_HOST()}remoteEntry.json?cacheTag=123abc`
      );

      expect(actual).toEqual([
        mockRemoteEntry_MFE1(),
        mockRemoteEntry_MFE2(),
        mockRemoteEntry_HOST(),
      ]);
    });

    it('should rename host remoteName to config defined name', async () => {
      config.hostRemoteEntry = {
        name: 'newHostName',
        url: `${mockScopeUrl_HOST()}remoteEntry.json`,
      };
      const actual = await getRemoteEntries({});

      expect(actual).toEqual([{ ...mockRemoteEntry_HOST(), name: 'newHostName' }]);
    });
  });

  describe('handling existing remotes', () => {
    it('should override fetching remotes that exist in the repository when enabled in config (not same-url)', async () => {
      config.profile.overrideCachedRemotes = 'always';
      config.profile.overrideCachedRemotesIfURLMatches = false;

      // Setup storage to contain one of the remotes
      adapters.remoteInfoRepo.tryGet = jest
        .fn()
        .mockImplementation(_ =>
          Optional.of({ scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }), exposes: [] })
        );

      const actual = await getRemoteEntries({
        'team/mfe1': `${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}`,
      });

      expect(actual).toEqual([{ ...mockRemoteEntry_MFE1(), override: true }]);
      expect(config.log.debug).toHaveBeenCalledWith(
        1,
        `Overriding existing remote 'team/mfe1' with '${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}'.`
      );
      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}`
      );
    });

    it('should skip fetching remotes that exist in the repository when disabled in config (same-url)', async () => {
      config.profile.overrideCachedRemotes = 'always';
      config.profile.overrideCachedRemotesIfURLMatches = false;

      // Setup storage to contain one of the remotes
      adapters.remoteInfoRepo.tryGet = jest
        .fn()
        .mockImplementation(_ =>
          Optional.of({ scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }), exposes: [] })
        );

      const actual = await getRemoteEntries({
        'team/mfe1': `${mockScopeUrl_MFE1({ folder: 'v1', file: 'remoteEntry.json' })}`,
      });

      expect(actual).toEqual([]);
      expect(config.log.debug).toHaveBeenCalledWith(
        1,
        `Found remote 'team/mfe1' in storage, omitting fetch.`
      );
      expect(adapters.remoteEntryProvider.provide).not.toHaveBeenCalled();
    });

    it('should skip fetching remotes that exist in the repository when override disabled in config', async () => {
      config.profile.overrideCachedRemotes = 'never';
      config.profile.overrideCachedRemotesIfURLMatches = true;

      // Setup storage to contain one of the remotes
      adapters.remoteInfoRepo.tryGet = jest
        .fn()
        .mockImplementation(_ =>
          Optional.of({ scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }), exposes: [] })
        );

      const actual = await getRemoteEntries({
        'team/mfe1': `${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}`,
      });

      expect(actual).toEqual([]);
      expect(config.log.debug).toHaveBeenCalledWith(
        1,
        `Found remote 'team/mfe1' in storage, omitting fetch.`
      );
    });

    it('should override fetching remotes that exist in the repository when override "init-only" in config', async () => {
      config.profile.overrideCachedRemotes = 'init-only';
      config.profile.overrideCachedRemotesIfURLMatches = true;

      // Setup storage to contain one of the remotes
      adapters.remoteInfoRepo.tryGet = jest
        .fn()
        .mockImplementation(_ =>
          Optional.of({ scopeUrl: mockScopeUrl_MFE1({ folder: 'v1' }), exposes: [] })
        );

      const actual = await getRemoteEntries({
        'team/mfe1': `${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}`,
      });

      expect(actual).toEqual([{ ...mockRemoteEntry_MFE1(), override: true }]);
      expect(config.log.debug).toHaveBeenCalledWith(
        1,
        `Overriding existing remote 'team/mfe1' with '${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}'.`
      );
      expect(adapters.remoteEntryProvider.provide).toHaveBeenCalledWith(
        `${mockScopeUrl_MFE1({ folder: 'v2', file: 'remoteEntry.json' })}`
      );
    });
  });

  describe('error handling', () => {
    it('should handle failed remote fetch in non-strict mode', async () => {
      config.strict = false;
      adapters.remoteEntryProvider.provide = jest.fn(url => {
        if (url === `${mockScopeUrl_MFE1()}remoteEntry.json`) {
          return Promise.resolve(mockRemoteEntry_MFE1());
        }

        // remote 2
        return Promise.reject(new NFError(`Failed to fetch remoteEntry from ${url}`));
      });

      const actual = await getRemoteEntries(mockManifest());

      expect(actual).toEqual([mockRemoteEntry_MFE1()]);

      expect(config.log.warn).toHaveBeenCalledWith(
        1,
        "Could not fetch remote 'team/mfe2'. skipping init.",
        expect.any(NFError)
      );
    });

    it('should throw error when remote fetch fails in strict mode', async () => {
      config.strict = true;

      adapters.remoteEntryProvider.provide = jest.fn(url => {
        if (url === `${mockScopeUrl_MFE2()}remoteEntry.json`) {
          return Promise.resolve(mockRemoteEntry_MFE2());
        }
        return Promise.reject(new NFError(`Failed to fetch remoteEntry from ${url}`));
      });

      await expect(getRemoteEntries(mockManifest())).rejects.toEqual(
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
        'bad-mfe-name': `${mockScopeUrl_MFE1()}remoteEntry.json`,
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
        'bad-mfe-name': `${mockScopeUrl_MFE1()}remoteEntry.json`,
      };

      expect(getRemoteEntries(manifestWithBadEntryName)).rejects.toEqual(
        new NFError("Could not fetch remote 'bad-mfe-name'")
      );
    });
  });
});
