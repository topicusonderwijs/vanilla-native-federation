import { createGetRemoteEntries } from './get-remote-entries';
import { DrivingContract } from './driving-ports/driving.contract';
import { ForGettingRemoteEntries } from './driver-ports/for-getting-remote-entries.port';
import { mockManifestProvider } from '../6.mocks/adapters/manifest-provider.mock';
import { mockRemoteEntryProvider } from '../6.mocks/adapters/remote-entry-provider.mock';
import { mockRemoteInfoRepository } from '../6.mocks/adapters/remote-info.repository.mock';
import { MOCK_MANIFEST } from '../6.mocks/domain/manifest.mock';
import { MOCK_HOST_REMOTE_ENTRY, MOCK_HOST_REMOTE_ENTRY_SCOPE_URL, MOCK_REMOTE_ENTRY_I, MOCK_REMOTE_ENTRY_II, MOCK_REMOTE_ENTRY_SCOPE_I_URL, MOCK_REMOTE_ENTRY_SCOPE_II_URL } from '../6.mocks/domain/remote-entry/remote-entry.mock';
import { NFError } from '../native-federation.error';
import { HostConfig } from './config/host.contract';
import { LoggingConfig } from './config/log.contract';
import { ModeConfig } from './config/mode.contract';

describe('createGetRemoteEntries', () => {
    let getRemoteEntries: ForGettingRemoteEntries;
    let mockConfig: any;
    let mockAdapters: Pick<DrivingContract, 'remoteEntryProvider'|'manifestProvider'|'remoteInfoRepo'>;

    beforeEach(() => {
        mockConfig = {
            log: {
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                level: "debug"
            },
            latestSharedExternal: false,
            hostRemoteEntry: false,
            strict: false
        } as HostConfig & LoggingConfig & ModeConfig;
        
        mockAdapters = {
            remoteEntryProvider: mockRemoteEntryProvider(),
            manifestProvider: mockManifestProvider(),
            remoteInfoRepo: mockRemoteInfoRepository()
        };
        
        getRemoteEntries = createGetRemoteEntries(mockConfig, mockAdapters);
    });

    describe('fetching remote entries', () => {
        it('should fetch host and remote entries when given a manifest', async () => {
            const result = await getRemoteEntries(MOCK_MANIFEST());
            
            expect(mockAdapters.manifestProvider.provide).toHaveBeenCalledWith(MOCK_MANIFEST());
            expect(mockAdapters.remoteEntryProvider.provide).toHaveBeenCalledWith(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`);
            expect(mockAdapters.remoteEntryProvider.provide).toHaveBeenCalledWith(`${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`);
            
            expect(result).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II()]);
        });
        
        it('should return a list of remoteEntry objects', async () => {
            const result = await getRemoteEntries(MOCK_MANIFEST());
            
            expect(result).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II()]);
        });

        it('should fetch manifest from URL when given a string', async () => {
            const manifestUrl = 'http://my.service/manifest.json';
            
            const result = await getRemoteEntries(manifestUrl);
            
            expect(mockAdapters.manifestProvider.provide).toHaveBeenCalledWith(manifestUrl);

            expect(result).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II()]);

        });
        
        it('should use empty manifest when no argument is provided', async () => {
            await getRemoteEntries(undefined as any);
            
            expect(mockAdapters.manifestProvider.provide).toHaveBeenCalledWith({});
        });
        
        it('should log debug messages when remotes are fetched', async () => {
            await getRemoteEntries(MOCK_MANIFEST());
            
            expect(mockConfig.log.debug).toHaveBeenCalledWith(
                expect.stringContaining(`fetched 'team/mfe1' from '${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json'`)
            );
            expect(mockConfig.log.debug).toHaveBeenCalledWith(
                expect.stringContaining(`fetched 'team/mfe2' from '${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json'`)
            );
        });
    });

    describe("with host remoteEntry", () => {
        it('should process hostRemoteEntry if defined in config', async () => {
            mockConfig.hostRemoteEntry = {
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`
            }
            const result = await getRemoteEntries(MOCK_MANIFEST());
            
            expect(result).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II(), MOCK_HOST_REMOTE_ENTRY()]);
            expect(result[0]!.host).toBeUndefined();
            expect(result[1]!.host).toBeUndefined();
            expect(result[2]!.host).toBe(true);
        });

        it('should process hostRemoteEntry if defined in config', async () => {
            mockConfig.hostRemoteEntry = {
                url: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json`,
                cacheTag: "123abc"
            }
            const result = await getRemoteEntries(MOCK_MANIFEST());
            
            expect(mockAdapters.remoteEntryProvider.provide).toHaveBeenCalledWith(`${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}remoteEntry.json?cacheTag=123abc`);

            expect(result).toEqual([MOCK_REMOTE_ENTRY_I(), MOCK_REMOTE_ENTRY_II(), MOCK_HOST_REMOTE_ENTRY()]);
        });
    })
    
    describe('handling existing remotes', () => {
        it('should skip fetching remotes that exist in the repository', async () => {
            // Setup repository to contain one of the remotes
            mockAdapters.remoteInfoRepo.contains = jest.fn().mockImplementation((name) => name === 'team/mfe1');
            
            const result = await getRemoteEntries(MOCK_MANIFEST());
            
            expect(result).toEqual([MOCK_REMOTE_ENTRY_II()]);
            
            expect(mockConfig.log.debug).toHaveBeenCalledWith(
                expect.stringContaining("Found remote 'team/mfe1' in storage, omitting fetch.")
            );
        });
    });
    
    describe('error handling', () => {
        
        it('should handle failed remote fetch in non-strict mode', async () => {
            mockConfig.strict = false;
            mockAdapters.remoteEntryProvider.provide = jest.fn((url) => {
                if (url === `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`) {
                    return Promise.resolve(MOCK_REMOTE_ENTRY_I());
                } 

                // remote 2
                return Promise.reject(new NFError(`Failed to fetch remoteEntry from ${url}`));
            });
            
            const result = await getRemoteEntries(MOCK_MANIFEST());
            
            expect(result).toEqual([MOCK_REMOTE_ENTRY_I()]);

            expect(mockConfig.log.warn).toHaveBeenCalledWith(
                'Failed to fetch remoteEntry.',
                expect.any(NFError)
            );
        });
        
        it('should throw error when remote fetch fails in strict mode', async () => {
            mockConfig.strict = true;
            
            mockAdapters.remoteEntryProvider.provide = jest.fn((url) => {
                if (url === `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`) {
                    return Promise.resolve(MOCK_REMOTE_ENTRY_II());
                }
                return Promise.reject(new NFError(`Failed to fetch remoteEntry from ${url}`));
            });
            
            await expect(getRemoteEntries(MOCK_MANIFEST())).rejects.toEqual(
                new NFError('Could not fetch remoteEntry.')
            );

            expect(mockConfig.log.warn).toHaveBeenCalledWith(
                'Failed to fetch remoteEntry.',
                expect.any(NFError)
            );
        });
        
        it('should throw error when manifest provider fails', async () => {
            mockAdapters.manifestProvider.provide = jest.fn().mockRejectedValue(
                new NFError('Failed to fetch manifest')
            );
            
            await expect(getRemoteEntries('http://bad.manifest.url')).rejects.toEqual(
                new NFError('Could not fetch manifest.')
            );

            expect(mockConfig.log.warn).toHaveBeenCalledWith(
                'Failed to fetch manifest.',
                expect.any(NFError)
            );
        });
        
        it('should warn when remote entry name does not match requested name', async () => {
            const manifestWithBadEntryName = { 
                "bad-mfe-name": `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
            };
            
            await getRemoteEntries(manifestWithBadEntryName);
            
            expect(mockConfig.log.warn).toHaveBeenCalledWith(
                expect.stringContaining("Fetched remote 'team/mfe1' does not match requested 'bad-mfe-name'.")
            );
        });
    });
});