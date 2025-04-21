import { ForProvidingRemoteEntries } from "lib/2.app/driving-ports/for-providing-remote-entries.port";
import { MOCK_HOST_REMOTE_ENTRY, MOCK_HOST_REMOTE_ENTRY_SCOPE_URL, MOCK_REMOTE_ENTRY_I, MOCK_REMOTE_ENTRY_II, MOCK_REMOTE_ENTRY_SCOPE_I_URL, MOCK_REMOTE_ENTRY_SCOPE_II_URL } from "../domain/remote-entry/remote-entry.mock";
import { NFError } from "lib/native-federation.error";

export const mockRemoteEntryProvider = ()
    : jest.Mocked<ForProvidingRemoteEntries> => ({
        provide: jest.fn().mockImplementation(
            (url:string) => {
                if (url === `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`) {
                    return Promise.resolve(MOCK_REMOTE_ENTRY_I());
                } 
                if (url === `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`) {
                    return Promise.resolve(MOCK_REMOTE_ENTRY_II());
                }
                if (url.startsWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`)) {
                    return Promise.resolve(MOCK_HOST_REMOTE_ENTRY());
                } 
                return Promise.reject(new NFError(`Fetch of '${url}' returned 404 Not Found`));
            }
        )
    })