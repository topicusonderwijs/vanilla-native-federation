import { createRemoteEntryProvider } from './remote-entry-provider';
import { RemoteEntry } from '../../1.domain/remote-entry/remote-entry.contract';
import { HostConfig } from '../../2.app/config/host.contract';
import { ForProvidingRemoteEntries } from '../../2.app/driving-ports/for-providing-remote-entries.port';
import { NFError } from '../../native-federation.error';
import { MOCK_FEDERATION_INFO_I } from "../../6.mocks/domain/remote-entry/federation-info.mock";
import { MOCK_REMOTE_ENTRY_I, MOCK_REMOTE_ENTRY_SCOPE_I_URL, MOCK_HOST_REMOTE_ENTRY_SCOPE_URL, MOCK_HOST_REMOTE_ENTRY } from "../../6.mocks/domain/remote-entry/remote-entry.mock";

describe('createRemoteEntryProvider', () => {
    let remoteEntryProvider: ForProvidingRemoteEntries;
    let mockConfig: HostConfig;

    const mockFetchAPI = (response: Partial<RemoteEntry>, opt: {success: boolean}) => {
        global.fetch = jest.fn((_) => {
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
                statusText: "Not Found"
            } as Response);
        }) as jest.Mock;
    };

    beforeEach(() => {
        mockConfig = {
            hostRemoteEntry: {
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`
            }
        };
                
        remoteEntryProvider = createRemoteEntryProvider(mockConfig);
    });

    describe('provideRemote', () => {
        it('should fetch and return the remote entry', async () => {
            mockFetchAPI(MOCK_FEDERATION_INFO_I(), {success: true});

            const result = await remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);

            expect(fetch).toHaveBeenCalledWith(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);
            expect(result).toEqual(MOCK_REMOTE_ENTRY_I());
        });

        it('should fill empty fields with defaults', async () => {            
            mockFetchAPI({ name: 'test-remote' }, {success: true});

            const result = await remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);

            expect(result).toEqual({
                name: 'test-remote',
                url: `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
                exposes: [],
                shared: []
            });
        });

        it('should reject with NFError when fetch fails', async () => {
            mockFetchAPI(MOCK_FEDERATION_INFO_I(), {success: false});
            
            await expect(remoteEntryProvider.provideRemote('http://bad.service/remoteEntry.js'))
                .rejects
                .toEqual(new NFError("Fetch of 'http://bad.service/remoteEntry.js' returned 404 - Not Found"));
        });

        
        it('should reject with NFError when JSON parsing fails', async () => {            
            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
            
            global.fetch = jest.fn(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                } as unknown as Response);
            }) as jest.Mock;

            await expect(remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`))
                .rejects
                .toEqual(new NFError("Fetch of 'http://my.service/mfe1/remoteEntry.json' returned Invalid JSON"));
        });
    });

    describe('provideHost', () => {
        it('should fetch and return the host remote entry', async () => {
            
            mockFetchAPI(MOCK_HOST_REMOTE_ENTRY(), {success: true});

            const result = await remoteEntryProvider.provideHost();

            expect(fetch).toHaveBeenCalledWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`);

            expect(result).toEqual({
                ...MOCK_HOST_REMOTE_ENTRY(),
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`,
                exposes: [],
                host: true
            });
        });

        it('should mark the remote entry as host', async () => {            
            mockFetchAPI(MOCK_HOST_REMOTE_ENTRY(), {success: true});

            const result = await remoteEntryProvider.provideHost();

            expect(result).toHaveProperty('host', true);
        });

        it('should fill empty fields with defaults for host remote entry', async () => {
            const mockHostRemoteEntry = {
                name: 'host-remote',
                version: '1.0.0'
            };
            
            mockFetchAPI(mockHostRemoteEntry, {success: true});

            const result = await remoteEntryProvider.provideHost();

            expect(result).toEqual({
                name: 'host-remote',
                version: '1.0.0',
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`,
                exposes: [],
                shared: [],
                host: true
            });
        });

        it('should append cache tag to URL when provided', async () => {
            const cacheTag = 'v1234';
            mockConfig.hostRemoteEntry = {
                url: 'http://my.host/remoteEntry.js',
                cacheTag
            };
                        
            const mockHostRemoteEntry = MOCK_HOST_REMOTE_ENTRY();
            
            mockFetchAPI(mockHostRemoteEntry, {success: true});

            await remoteEntryProvider.provideHost();

            expect(fetch).toHaveBeenCalledWith(`http://my.host/remoteEntry.js?cacheTag=${cacheTag}`);
        });

        it('should return false when no hostRemoteEntry config is provided', async () => {
            mockConfig.hostRemoteEntry = false;
            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
            
            const result = await remoteEntryProvider.provideHost();

            expect(fetch).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });

        it('should reject with NFError when fetch fails', async () => {
            mockFetchAPI(MOCK_FEDERATION_INFO_I(), {success: false});
            
            await expect(remoteEntryProvider.provideHost())
                .rejects
                .toEqual(new NFError("Fetch of 'http://host.service/remoteEntry.json' returned 404 - Not Found"));
        });



        it('should handle JSON parsing errors for host', async () => {            
            global.fetch = jest.fn(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                } as unknown as Response);
            }) as jest.Mock;

            await expect(remoteEntryProvider.provideHost())
                .rejects
                .toEqual(new NFError("Fetch of 'http://host.service/remoteEntry.json' returned Invalid JSON"));
        });
    });
});