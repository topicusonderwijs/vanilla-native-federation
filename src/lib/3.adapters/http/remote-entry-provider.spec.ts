import { createRemoteEntryProvider } from './remote-entry-provider';
import { RemoteEntry } from '../../1.domain/remote-entry/remote-entry.contract';
import { HostConfig } from '../../2.app/config/host.contract';
import { ModeConfig } from '../../2.app/config/mode.contract';
import { LoggingConfig } from '../../2.app/config/log.contract';
import { ForProvidingRemoteEntries } from '../../2.app/driving-ports/for-providing-remote-entries.port';
import { createMockLogHandler } from '../../6.mocks/handlers/log.handler';
import { NFError } from '../../native-federation.error';
import { MOCK_FEDERATION_INFO_I } from "../../6.mocks/domain/remote-entry/federation-info.mock";
import { MOCK_REMOTE_ENTRY_I, MOCK_REMOTE_ENTRY_SCOPE_I, MOCK_HOST_REMOTE_ENTRY_SCOPE, MOCK_HOST_REMOTE_ENTRY } from "../../6.mocks/domain/remote-entry/remote-entry.mock";

describe('createRemoteEntryProvider', () => {
    let remoteEntryProvider: ForProvidingRemoteEntries;
    let mockConfig: HostConfig & ModeConfig & LoggingConfig;
    let mockLogger: any;

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
        mockLogger = createMockLogHandler();
        
        mockConfig = {
            hostRemoteEntry: {
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE()}remoteEntry.json`
            },
            strict: false,
            latestSharedExternal: false,
            log: mockLogger,
        };
        
        mockFetchAPI(MOCK_FEDERATION_INFO_I(), {success: true});
        
        remoteEntryProvider = createRemoteEntryProvider(mockConfig);
    });

    describe('initialization', () => {
        it('should create a valid provider instance', () => {
            expect(remoteEntryProvider).toBeDefined();
            expect(typeof remoteEntryProvider.provideRemote).toBe('function');
            expect(typeof remoteEntryProvider.provideHost).toBe('function');
        });
    });

    describe('provideRemote', () => {
        it('should fetch and return the remote entry', async () => {
            const result = await remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`);

            expect(fetch).toHaveBeenCalledWith(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`);
            expect(result).toEqual(MOCK_REMOTE_ENTRY_I());
        });

        it('should fill empty fields with defaults', async () => {
            const mockRemoteEntry = {
                name: 'test-remote',
                version: '1.0.0'
            };
            
            mockFetchAPI(mockRemoteEntry, {success: true});

            const result = await remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`);

            expect(result).toEqual({
                name: 'test-remote',
                version: '1.0.0',
                url: `${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`,
                exposes: [],
                shared: []
            });
        });

        it('should handle fetch errors by returning false in non-strict mode', async () => {            
            mockFetchAPI(MOCK_FEDERATION_INFO_I(), {success: false});

            const result = await remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`);

            expect(fetch).toHaveBeenCalledWith(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`);
            expect(result).toBe(false);
            expect(mockLogger.debug).toHaveBeenCalled();
        });
        
        it('should reject with NFError in strict mode when fetch fails', async () => {
            const badRemoteEntryUrl = 'http://bad.service/remoteEntry.js';
            mockConfig.strict = true;

            mockFetchAPI(MOCK_FEDERATION_INFO_I(), {success: false});

            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
            
            await expect(remoteEntryProvider.provideRemote(badRemoteEntryUrl))
                .rejects
                .toEqual(new NFError('Could not fetch remote metadata'));
                
            expect(mockLogger.debug).toHaveBeenCalled();
        });

        it('should handle invalid JSON responses in non-strict mode', async () => {
            
            global.fetch = jest.fn(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                } as unknown as Response);
            }) as jest.Mock;

            const result = await remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`);

            expect(result).toBe(false);
            expect(mockLogger.debug).toHaveBeenCalled();
        });
        
        it('should reject with NFError in strict mode when JSON parsing fails', async () => {
            mockConfig.strict = true;
            
            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
            
            global.fetch = jest.fn(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                } as unknown as Response);
            }) as jest.Mock;

            await expect(remoteEntryProvider.provideRemote(`${MOCK_REMOTE_ENTRY_SCOPE_I()}remoteEntry.json`))
                .rejects
                .toEqual(new NFError('Could not fetch remote metadata'));
                
            expect(mockLogger.debug).toHaveBeenCalled();
        });
    });

    describe('provideHost', () => {
        it('should fetch and return the host remote entry', async () => {
            
            mockFetchAPI(MOCK_HOST_REMOTE_ENTRY(), {success: true});

            const result = await remoteEntryProvider.provideHost();

            expect(fetch).toHaveBeenCalledWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE()}remoteEntry.json`);

            expect(result).toEqual({
                ...MOCK_HOST_REMOTE_ENTRY(),
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE()}remoteEntry.json`,
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
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE()}remoteEntry.json`,
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
            
            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
            
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

        it('should handle fetch errors for host remote entry by returning false in non-strict mode', async () => {            
            mockFetchAPI(MOCK_HOST_REMOTE_ENTRY(), {success: false});

            const result = await remoteEntryProvider.provideHost();

            expect(fetch).toHaveBeenCalledWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE()}remoteEntry.json`);
            expect(result).toBe(false);
            expect(mockLogger.debug).toHaveBeenCalled();
        });
        
        it('should reject with NFError in strict mode when host fetch fails', async () => {
            mockConfig.strict = true;
            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
                        
            mockFetchAPI(MOCK_HOST_REMOTE_ENTRY(), {success: false});

            await expect(remoteEntryProvider.provideHost())
                .rejects
                .toEqual(new NFError('Could not fetch host metadata'));
                
            expect(fetch).toHaveBeenCalledWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE()}remoteEntry.json`);
            expect(mockLogger.debug).toHaveBeenCalled();
        });

        it('should handle JSON parsing errors for host in non-strict mode', async () => {            
            global.fetch = jest.fn(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                } as unknown as Response);
            }) as jest.Mock;

            const result = await remoteEntryProvider.provideHost();

            expect(result).toBe(false);
            expect(mockLogger.debug).toHaveBeenCalled();
        });
        
        it('should reject with NFError in strict mode when host JSON parsing fails', async () => {
            mockConfig.strict = true;
            remoteEntryProvider = createRemoteEntryProvider(mockConfig);
            
            global.fetch = jest.fn(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                } as unknown as Response);
            }) as jest.Mock;

            await expect(remoteEntryProvider.provideHost())
                .rejects
                .toEqual(new NFError('Could not fetch host metadata'));
                
            expect(mockLogger.debug).toHaveBeenCalled();
        });
    });
});