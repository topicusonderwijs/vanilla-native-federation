import { sharedInfoHandlerFactory } from './shared-info.handler';
import { SharedInfoHandler } from './shared-info.contract';
import { Remote } from '../remote-info';
import { SharedInfo } from '@softarc/native-federation-runtime';
import { mockStorageHandler } from '../../../mock/handlers.mock';
import { StorageEntry, StorageHandler } from '../storage/storage.contract';

describe('sharedInfoHandler', () => {
    let storageHandler: StorageHandler<{"externals": StorageEntry<Record<string, string>>}>;
    let sharedInfoHandler: SharedInfoHandler;

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
                },
                {
                    packageName: "tslib",
                    outFileName: "tslib.js",
                    requiredVersion: "^2.3.0",
                    singleton: true,
                    strictVersion: true,
                    version: "2.8.1",
                },
            ] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'main.js'}], 
            baseUrl: 'http://localhost:3001/mfe1'
        }))

    beforeEach(() => {
        storageHandler = mockStorageHandler();
        sharedInfoHandler = sharedInfoHandlerFactory(storageHandler);
    });

    describe('addToCache', () => {
        it('should add externals of RemoteInfo to cache', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {}} as {externals: Record<string,string>}

            const expected = {
                // "<packageName>@<version>": "<baseUrl>/<outFileName>"
                "rxjs@7.8.1": "http://localhost:3001/mfe1/rxjs.js",
                "tslib@2.8.1": "http://localhost:3001/mfe1/tslib.js"
            }

            sharedInfoHandler.addToCache(remote);

            const [key, mutation] = (storageHandler.mutate as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should append new externals to cache', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {
                "rxjs/operators@7.8.1": "http://localhost:3001/mfe1/rxjs_operators.js"
            }} as {externals: Record<string,string>}

            const expected = {
                "rxjs@7.8.1": "http://localhost:3001/mfe1/rxjs.js",
                "rxjs/operators@7.8.1": "http://localhost:3001/mfe1/rxjs_operators.js",
                "tslib@2.8.1": "http://localhost:3001/mfe1/tslib.js"
            }

            sharedInfoHandler.addToCache(remote);

            const [key, mutation] = (storageHandler.mutate as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should not create duplicate externals in cache', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {
                "rxjs@7.8.1": "http://localhost:3001/mfe1/rxjs.js"
            }} as {externals: Record<string,string>}

            const expected = {
                "rxjs@7.8.1": "http://localhost:3001/mfe1/rxjs.js",
                "tslib@2.8.1": "http://localhost:3001/mfe1/tslib.js"
            }

            sharedInfoHandler.addToCache(remote);

            const [key, mutation] = (storageHandler.mutate as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

    });

    describe('mapSharedDeps', () => {
        it('Should return all shared dependencies with an empty cache', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {}} as {externals: Record<string,string>};

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const expected = {
                "rxjs": "http://localhost:3001/mfe1/rxjs.js",
                "tslib": "http://localhost:3001/mfe1/tslib.js"
            }

            const actual = sharedInfoHandler.mapSharedDeps(remote);

            expect(actual).toEqual(expected);
        });

        it('Should prioritize cached returning shared dependencies', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {
                "rxjs@7.8.1": "http://localhost:3001/other-source/rxjs.js"
            }} as {externals: Record<string,string>};

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const expected = {
                "rxjs": "http://localhost:3001/other-source/rxjs.js",
                "tslib": "http://localhost:3001/mfe1/tslib.js"
            }

            const actual = sharedInfoHandler.mapSharedDeps(remote);

            expect(actual).toEqual(expected);
        });

        it('Should only return shared dependencies from remote', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {
                "rxjs/operators@7.8.1": "http://localhost:3001/mfe1/rxjs_operators.js"
            }} as {externals: Record<string,string>};

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const expected = {
                "rxjs": "http://localhost:3001/mfe1/rxjs.js",
                "tslib": "http://localhost:3001/mfe1/tslib.js"
            }

            const actual = sharedInfoHandler.mapSharedDeps(remote);

            expect(actual).toEqual(expected);
        });

        it('Should only return the right version', () => {
            const remote = REMOTE_MFE1_MOCK();
            const cache = {externals: {
                "rxjs@7.8.2": "http://localhost:3001/other-source/rxjs.js"
            }} as {externals: Record<string,string>};

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const expected = {
                "rxjs": "http://localhost:3001/mfe1/rxjs.js",
                "tslib": "http://localhost:3001/mfe1/tslib.js"
            }

            const actual = sharedInfoHandler.mapSharedDeps(remote);

            expect(actual).toEqual(expected);
        });

        
    });
});