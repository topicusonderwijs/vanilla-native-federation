import { NfCache, StorageHandler } from "../storage/storage.contract";
import { RemoteInfo, RemoteInfoHandler } from "./remote-info.contract";
import { mockStorageHandler } from './../../../mock/handlers.mock';
import { remoteInfoHandlerFactory } from './remote-info.handler';
import { ExposesInfo, SharedInfo } from "@softarc/native-federation-runtime";
import { NFError } from "../../native-federation.error";
import { RemoteEntryConfig } from '../../config/config.contract';

describe('remoteInfoHandler', () => {
    let storageHandler: StorageHandler<NfCache>;
    let remoteInfoHandler: RemoteInfoHandler;

    const MOCK_SHARED_INFO = (): SharedInfo[] => 
        [
            {
                packageName: "rxjs",
                outFileName: "rxjs.js",
                requiredVersion: "~7.8.0",
                singleton: true,
                strictVersion: true,
                version: "7.8.1",
            }
        ] as SharedInfo[]

   const MOCK_FEDERATION_INFO = (): {name: string, exposes: ExposesInfo[]} => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            exposes: [{key: './comp', outFileName: 'comp.js'}]
        }))



    const MOCK_FEDERATION_INFO_II = (): {name: string, exposes: ExposesInfo[]} => 
            JSON.parse(JSON.stringify({
                name: 'team/mfe2', 
                exposes: [{key: './comp', outFileName: 'comp.js'}]
            }))


    beforeEach(() => {
        storageHandler = mockStorageHandler();
        const mockConfig: RemoteEntryConfig = {hostRemoteEntry: false};
        remoteInfoHandler = remoteInfoHandlerFactory(mockConfig, storageHandler);
    });

    describe('toStorage', () => {
        it('should add remote to the storage', () => {
            const cache = {
                remotes: {},
            } 
            const expected = {
                remotes: { 
                    "team/mfe1": {
                        scopeUrl: "http://localhost:3001/",
                        remoteName: "team/mfe1",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                    } 
                }
            }

            remoteInfoHandler.toStorage(MOCK_FEDERATION_INFO(), "http://localhost:3001");

            const [entry, mutationFn] = (storageHandler.update as any).mock.calls[0];

            expect(entry).toBe("remotes");
            expect(mutationFn(cache.remotes)).toEqual(expected.remotes);
        });

        it('should handle remoteEntry.json path', () => {
            const cache = {
                remotes: {},
            } 
            const expected = {
                remotes: { 
                    "team/mfe1": {
                        scopeUrl: "http://localhost:3001/",
                        remoteName: "team/mfe1",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                    } 
                }
            }

            remoteInfoHandler.toStorage(MOCK_FEDERATION_INFO(), "http://localhost:3001/remoteEntry.json");

            const [entry, mutationFn] = (storageHandler.update as any).mock.calls[0];

            expect(entry).toBe("remotes");
            expect(mutationFn(cache.remotes)).toEqual(expected.remotes);
        });

        it('should append a remote to cache', () => {
            const cache = {
                remotes: {
                    "team/mfe1": {
                        scopeUrl: "http://localhost:3001/",
                        remoteName: "team/mfe1",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                    }
                },
            } 
            const expected = {
                remotes: { 
                    "team/mfe1": {
                        scopeUrl: "http://localhost:3001/",
                        remoteName: "team/mfe1",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                    },
                    "team/mfe2": {
                        scopeUrl: "http://localhost:3002/",
                        remoteName: "team/mfe2",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3002/comp.js"}]
                    }
                }
            }

            remoteInfoHandler.toStorage(MOCK_FEDERATION_INFO_II(), "http://localhost:3002");

            const [entry, mutationFn] = (storageHandler.update as any).mock.calls[0];

            expect(entry).toBe("remotes");
            expect(mutationFn(cache.remotes)).toEqual(expected.remotes);
        });
    });

    describe('fetchRemoteEntry', () => {

        it('Should fetch the remote from the remoteEntryUrl', async () => {
            const expected = { ...MOCK_FEDERATION_INFO(), shared: MOCK_SHARED_INFO() };

            (global.fetch as any) = jest.fn(() =>
                Promise.resolve({
                    status: 200,
                    ok: true,
                    json: () => {
                        const {name, shared, exposes} = { ...MOCK_FEDERATION_INFO(), shared: MOCK_SHARED_INFO() };
                        return Promise.resolve({name, shared, exposes})
                    }}
                )
            );

            const actual = await remoteInfoHandler.fetchRemoteEntry("http://localhost:3001/remoteEntry.json");
        
            expect(actual).toEqual(expected);
        }); 

        it('Should initialize missing properties', async () => {

            const expected = { shared: [], exposes: [] };

            (global.fetch as any) = jest.fn(() =>
                Promise.resolve({
                    status: 200,
                    ok: true,
                    json: () => {
                        return Promise.resolve({})
                    }}
                )
            );

            const actual = await remoteInfoHandler.fetchRemoteEntry("http://localhost:3001/remoteEntry.json");
        
            expect(actual).toEqual(expected);
        });

        it('Should throw error if fetch failed', async () => {
            (global.fetch as any) = jest.fn(() =>
                Promise.resolve({
                    status: 404,
                    ok: false,
                    statusText: "Entry does not exist"
                })
            );

            const actual = remoteInfoHandler.fetchRemoteEntry("http://localhost:3001/remoteEntry.json");

            expect(actual).rejects.toThrow(NFError);
            expect(actual).rejects.toThrow(`Fetching remote from 'http://localhost:3001/remoteEntry.json' failed: 404 - Entry does not exist`);
        });    

        it('Should throw error if no remoteEntryUrl', async () => {
            const actual = () => remoteInfoHandler.fetchRemoteEntry(undefined as any);
            
            expect(actual()).rejects.toThrow(NFError);
            expect(actual()).rejects.toThrow(`Module not registered, provide a valid remoteEntryUrl.`);
        });
    });

    describe('getHostRemoteEntryUrl', () => {
        let mockConfig: RemoteEntryConfig = {hostRemoteEntry: false};

        it('should return undefined if the config has a host remoteEntry.json disabled', () => {
            mockConfig.hostRemoteEntry = false;
            remoteInfoHandler = remoteInfoHandlerFactory(mockConfig, storageHandler);

            expect(remoteInfoHandler.getHostRemoteEntryUrl()).toBeUndefined();
        });

        it('should return the host remoteEntry url if the config has a host remoteEntry.json enabled', () => {
            mockConfig.hostRemoteEntry = {url: "./custom/remoteEntry.json"};
            remoteInfoHandler = remoteInfoHandlerFactory(mockConfig, storageHandler);

            expect(remoteInfoHandler.getHostRemoteEntryUrl()).toBe("./custom/remoteEntry.json");
        });

        it('should return the host remoteEntry url with cacheTag if', () => {
            mockConfig.hostRemoteEntry = {url: "./custom/remoteEntry.json", cacheTag: "123abc"};
            remoteInfoHandler = remoteInfoHandlerFactory(mockConfig, storageHandler);
            expect(remoteInfoHandler.getHostRemoteEntryUrl()).toBe("./custom/remoteEntry.json?t=123abc");
        });
    })

    describe('fromStorage', () => {
        let cache: { remotes: Record<string, RemoteInfo> }

        beforeEach(() => {
            cache = { 
                remotes: { 
                    "team/mfe1": {
                        scopeUrl: "http://localhost:3001/",
                        remoteName: "team/mfe1",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                    }
                },
            };
            (storageHandler.fetch as jest.Mock).mockImplementation(
                () => cache["remotes"] as Record<string, RemoteInfo>
            );
        })

        it('should fetch the remote from storage', () => {
            const expected = {
                scopeUrl: "http://localhost:3001/",
                remoteName: "team/mfe1",
                exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
            };

            const actual = remoteInfoHandler.fromStorage("team/mfe1");
        
            expect(actual).toEqual(expected);
        });  
    })

    describe('toScope', () => {
        it('should return the scope based on the remoteEntry url', () => {
            const remoteEntry = "http://localhost:3001/remoteEntry.json";

            const actual = remoteInfoHandler.toScope(remoteEntry);

            expect(actual).toBe("http://localhost:3001/");
        });

        it('should return the scope based on a folder url', () => {
            const remoteEntry = "http://localhost:3001/";

            const actual = remoteInfoHandler.toScope(remoteEntry);

            expect(actual).toBe("http://localhost:3001/");
        });

        it("should add the '/' suffix", () => {
            const remoteEntry = "http://localhost:3001";

            const actual = remoteInfoHandler.toScope(remoteEntry);

            expect(actual).toBe("http://localhost:3001/");
        });

        it("should not alter the global scope", () => {

            const actual = remoteInfoHandler.toScope("global");

            expect(actual).toBe("global");
        });
    });
});
