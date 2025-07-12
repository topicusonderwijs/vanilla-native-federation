import { createRemoteEntryProvider } from './remote-entry-provider';
import { RemoteEntry } from 'lib/1.domain/remote-entry/remote-entry.contract';
import { ForProvidingRemoteEntries } from 'lib/2.app/driving-ports/for-providing-remote-entries.port';
import { NFError } from 'lib/native-federation.error';
import { MOCK_FEDERATION_INFO_I } from 'lib/6.mocks/domain/remote-entry/federation-info.mock';
import {
  MOCK_REMOTE_ENTRY_I,
  MOCK_REMOTE_ENTRY_SCOPE_I_URL,
} from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';

describe('createRemoteEntryProvider', () => {
  let remoteEntryProvider: ForProvidingRemoteEntries;

  const mockFetchAPI = (response: Partial<RemoteEntry>, opt: { success: boolean }) => {
    global.fetch = jest.fn(_ => {
      if (opt.success) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response),
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);
    }) as jest.Mock;
  };

  beforeEach(() => {
    remoteEntryProvider = createRemoteEntryProvider();
  });

  describe('provide', () => {
    it('should fetch and return the remote entry', async () => {
      mockFetchAPI(MOCK_FEDERATION_INFO_I(), { success: true });

      const result = await remoteEntryProvider.provide(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`
      );

      expect(fetch).toHaveBeenCalledWith(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);
      expect(result).toEqual(MOCK_REMOTE_ENTRY_I());
    });

    it('should fill empty fields with defaults', async () => {
      mockFetchAPI({ name: 'test-remote' }, { success: true });

      const result = await remoteEntryProvider.provide(
        `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`
      );

      expect(result).toEqual({
        name: 'test-remote',
        url: `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
        exposes: [],
        shared: [],
      });
    });

    it('should reject with NFError when fetch fails', async () => {
      mockFetchAPI(MOCK_FEDERATION_INFO_I(), { success: false });

      await expect(
        remoteEntryProvider.provide('http://bad.service/remoteEntry.js')
      ).rejects.toEqual(
        new NFError("Fetch of 'http://bad.service/remoteEntry.js' returned 404 - Not Found")
      );
    });

    it('should reject with NFError when JSON parsing fails', async () => {
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error('Invalid JSON')),
        } as unknown as Response);
      }) as jest.Mock;

      await expect(
        remoteEntryProvider.provide(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`)
      ).rejects.toEqual(
        new NFError("Fetch of 'http://my.service/mfe1/remoteEntry.json' returned Invalid JSON")
      );
    });
  });
});
