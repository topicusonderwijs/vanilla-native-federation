import { SharedInfo } from "@softarc/native-federation-runtime";
import { NfCache, StorageHandler } from "../storage/storage.contract";
import { Remote, RemoteInfoHandler } from "./remote-info.contract";
import { mockStorageHandler, mockSharedInfoHandler } from './../../../mock/handlers.mock';
import { remoteInfoHandlerFactory } from './remote-info.handler';
import { SharedInfoHandler } from "../shared-info";
import { NFError } from "../../native-federation.error";

describe('remoteInfoHandler', () => {
    let storageHandler: StorageHandler<NfCache>;
    let sharedInfoHandler: SharedInfoHandler;
    let remoteInfoHandler: RemoteInfoHandler;

    const REMOTE_MFE1_MOCK: () => Remote = () => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            shared: [
                {
                    packageName: "rxjs",
                    outFileName: "rxjs.js",
                    requiredVersion: "~7.8.0",
                    singleton: true,
                    strictVersion: true,
                    version: "7.8.1",
                }
            ] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'comp.js'}], 
            baseUrl: 'http://localhost:3001'
        }))

    const REMOTE_MFE2_MOCK: () => Remote = () => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe2', 
            shared: [
                {
                    packageName: "rxjs",
                    outFileName: "rxjs.js",
                    requiredVersion: "~7.8.0",
                    singleton: true,
                    strictVersion: true,
                    version: "7.8.1",
                }
            ] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'comp.js'}], 
            baseUrl: 'http://localhost:3002'
        }))

    beforeEach(() => {
        storageHandler = mockStorageHandler();
        sharedInfoHandler = mockSharedInfoHandler();
        remoteInfoHandler = remoteInfoHandlerFactory(storageHandler, sharedInfoHandler);
    });

    describe('addToCache', () => {
        it('should add remote to cache', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {
                remoteNamesToRemote: {},
                baseUrlToRemoteNames: {}
            } 
            const expected = {
                remoteNamesToRemote: { "team/mfe1": REMOTE_MFE1_MOCK() },
                baseUrlToRemoteNames: { "http://localhost:3001": "team/mfe1" }
            }

            remoteInfoHandler.addToCache(remote);

            const [m1_key, m1_mutation] = (storageHandler.update as any).mock.calls[0];
            const [m2_key, m2_mutation] = (storageHandler.update as any).mock.calls[1];

            expect(m1_key).toBe("remoteNamesToRemote");
            expect(m1_mutation(cache.remoteNamesToRemote)).toEqual(expected.remoteNamesToRemote);

            expect(m2_key).toBe("baseUrlToRemoteNames");
            expect(m2_mutation(cache.remoteNamesToRemote)).toEqual(expected.baseUrlToRemoteNames);
        });

        it('should append a remote to cache', () => {
            const remote = REMOTE_MFE1_MOCK();

            const cache = {
                remoteNamesToRemote: { "team/mfe2": REMOTE_MFE2_MOCK() },
                baseUrlToRemoteNames: { "http://localhost:3002": "team/mfe2" }
            } 
            const expected = {
                remoteNamesToRemote: { 
                    "team/mfe1": REMOTE_MFE1_MOCK(),
                    "team/mfe2": REMOTE_MFE2_MOCK()
                },
                baseUrlToRemoteNames: { 
                    "http://localhost:3002": "team/mfe2",
                    "http://localhost:3001": "team/mfe1" 
                }
            }

            remoteInfoHandler.addToCache(remote);

            const [m1_key, m1_mutation] = (storageHandler.update as any).mock.calls[0];
            const [m2_key, m2_mutation] = (storageHandler.update as any).mock.calls[1];

            expect(m1_key).toBe("remoteNamesToRemote");
            expect(m1_mutation(cache.remoteNamesToRemote)).toEqual(expected.remoteNamesToRemote);

            expect(m2_key).toBe("baseUrlToRemoteNames");
            expect(m2_mutation(cache.baseUrlToRemoteNames)).toEqual(expected.baseUrlToRemoteNames);
        });

        it('should also cache the externals', () => {
            const remote = REMOTE_MFE1_MOCK();

            remoteInfoHandler.addToCache(remote);

            expect(sharedInfoHandler.addToCache).toHaveBeenCalledWith(remote);
        });
    });

    describe('getFromEntry', () => {

        it('Should fetch the remote from the remoteEntryUrl', async () => {
            const expected = REMOTE_MFE1_MOCK();

            (global.fetch as any) = jest.fn(() =>
                Promise.resolve({
                    status: 200,
                    ok: true,
                    json: () => {
                        const {name, shared, exposes} = REMOTE_MFE1_MOCK();
                        return Promise.resolve({name, shared, exposes})
                    }}
                )
            );

            const actual = await remoteInfoHandler.getFromEntry("http://localhost:3001/remoteEntry.json");
        
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

            const actual = remoteInfoHandler.getFromEntry("http://localhost:3001/remoteEntry.json");

            expect(actual).rejects.toThrow(NFError);
            expect(actual).rejects.toThrow(`Fetching remote from 'http://localhost:3001/remoteEntry.json' failed: 404 - Entry does not exist`);
        });    

        it('Should throw error if no remoteEntryUrl', async () => {
            const actual = () => remoteInfoHandler.getFromEntry(undefined as any);
            
            expect(actual()).rejects.toThrow(NFError);
            expect(actual()).rejects.toThrow(`Module not registered, provide a valid remoteEntryUrl.`);
        });
    });

    describe('getFromCache', () => {
        let cache: { remoteNamesToRemote: Record<string, Remote>,  baseUrlToRemoteNames: Record<string,string> }

        beforeEach(() => {
            cache = { 
                remoteNamesToRemote: { "team/mfe1": REMOTE_MFE1_MOCK() },
                baseUrlToRemoteNames: { "http://localhost:3001": "team/mfe1" }
            };
            (storageHandler.fetch as jest.Mock).mockImplementation(
                (entry: 'remoteNamesToRemote'|'baseUrlToRemoteNames') => cache[entry] as any
            );
        })

        it('should fetch the remote from the cache', async () => {
            const expected = REMOTE_MFE1_MOCK();

            const actual = await remoteInfoHandler.getFromCache("http://localhost:3001/remoteEntry.json", "team/mfe1");
        
            expect(actual).toEqual(expected);
        });  
        
        it('should fetch the remote from the cache if no url provided', async () => {
            const expected = REMOTE_MFE1_MOCK();

            const actual = await remoteInfoHandler.getFromCache(undefined, "team/mfe1");
        
            expect(actual).toEqual(expected);
        });    

        it('should get the remoteName from the url when not provided', async () => {
            const expected = REMOTE_MFE1_MOCK();

            const actual = await remoteInfoHandler.getFromCache("http://localhost:3001/remoteEntry.json", undefined);
        
            expect(actual).toEqual(expected);
        });  

        it('should reject if remoteName is not in cache', async () => {
            const actual = remoteInfoHandler.getFromCache(undefined, "team/unknown-mfe");
        
            expect(actual).rejects.toThrow(NFError);
            await expect(actual).rejects.toThrow("Remote 'team/unknown-mfe' not found in cache.");
        });  

        it('should reject if no remoteName and URL are provided', async () => {
            const actual = remoteInfoHandler.getFromCache(undefined, undefined);
        
            expect(actual).rejects.toThrow(NFError);
            expect(actual).rejects.toThrow("Invalid remoteEntry or remoteName");
        });  

        it('should reject if no remoteName and URL is not in cache', async () => {
            const actual = remoteInfoHandler.getFromCache("http://wrong.url/remoteEntry.json", undefined);
        
            expect(actual).rejects.toThrow(NFError);
            expect(actual).rejects.toThrow("Invalid remoteEntry or remoteName");
        }); 
    })
});