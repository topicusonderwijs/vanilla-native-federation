import { createRemoteEntryProvider } from './remote-entry-provider';
import { RemoteEntry } from 'lib/1.domain/remote-entry/remote-entry.contract';
import { ForProvidingRemoteEntries } from 'lib/2.app/driving-ports/for-providing-remote-entries.port';
import { mockFederationInfo_MFE1 } from 'lib/6.mocks/domain/remote-entry/federation-info.mock';
import { mockRemoteEntry_MFE1 } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { mockScopeUrl_MFE1 } from 'lib/6.mocks/domain/scope-url.mock';
import { NFError } from 'lib/native-federation.error';

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
      mockFetchAPI(mockFederationInfo_MFE1(), { success: true });

      const result = await remoteEntryProvider.provide(`${mockScopeUrl_MFE1()}remoteEntry.json`);

      expect(fetch).toHaveBeenCalledWith(`${mockScopeUrl_MFE1()}remoteEntry.json`);
      expect(result).toEqual(mockRemoteEntry_MFE1());
    });

    it('should fill empty fields with defaults', async () => {
      mockFetchAPI({ name: 'test-remote' }, { success: true });

      const result = await remoteEntryProvider.provide(`${mockScopeUrl_MFE1()}remoteEntry.json`);

      expect(result).toEqual({
        name: 'test-remote',
        url: `${mockScopeUrl_MFE1()}remoteEntry.json`,
        exposes: [],
        shared: [],
      });
    });

    it('should reject with NFError when fetch fails', async () => {
      mockFetchAPI(mockFederationInfo_MFE1(), { success: false });

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
        remoteEntryProvider.provide(`${mockScopeUrl_MFE1()}remoteEntry.json`)
      ).rejects.toEqual(
        new NFError("Fetch of 'http://my.service/mfe1/remoteEntry.json' returned Invalid JSON")
      );
    });
  });
});
