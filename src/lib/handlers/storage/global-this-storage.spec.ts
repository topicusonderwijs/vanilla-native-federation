import { globalThisStorageEntry } from './global-this-storage';
import { NfCache, nfNamespace } from './storage.contract';

describe('globalThisStorageEntry', () => {
    // type MOCK_CACHE = NfCache & {key1: string, key2: string}

    beforeEach(() => {
        delete (globalThis as any)[nfNamespace];
    });

    it('creates namespace if it does not exist', () => {
        globalThisStorageEntry('baseUrlToRemoteNames', {'http://localhost:3001/': 'mfe1'});
        // globalThisStorageEntry('externals', {"rxjs@7.8.1": {version: "7.8.1", url: "http://localhost:3001/rxjs.js"}});
        expect((globalThis as any)[nfNamespace]).toEqual({
            "baseUrlToRemoteNames": {'http://localhost:3001/': 'mfe1'}
        });
    });

    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = globalThisStorageEntry('baseUrlToRemoteNames', {'http://localhost:3001/': 'mfe1'});
            const expected = entry.get();

            expect(expected).toEqual({ "http://localhost:3001/": "mfe1" });
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('baseUrlToRemoteNames', {'http://localhost:3001/': 'mfe1'});
            const keyA = entry.get();
            keyA["http://localhost:3002/"] = "mfe2";
             
            const expected = entry.get();

            expect(expected).toEqual({
                'http://localhost:3001/': 'mfe1'
            });
        });
    })

    describe('set', () => {
        it('set stores value in globalThis namespace', () => {
            const entry = globalThisStorageEntry('baseUrlToRemoteNames', {'http://localhost:3001/': 'mfe1'});
            entry.set({"tslib@2.8.1": "http://localhost:3001/tslib.js"});

            expect(entry.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
        });

        it('maintains separate values for different keys', () => {
            const entry1 = globalThisStorageEntry('externals', {
                global:{
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js"}
                }
            });
            const entry2 = globalThisStorageEntry('baseUrlToRemoteNames', { "http://localhost:3001": "team/mfe1" });
            
            entry1.set({
                global:{
                    "tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url: "http://localhost:3001/tslib.js"}
                }
            });
            entry2.set({ "http://localhost:3002": "team/mfe2" });
            
            expect(entry1.get()).toEqual({
                global:{
                    "tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url: "http://localhost:3001/tslib.js"}
                }
            });
            expect(entry2.get()).toEqual({ "http://localhost:3002": "team/mfe2" });
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('baseUrlToRemoteNames', { "http://localhost:3001": "mfe1" });
            const newEntry: Record<string, string> = {"http://localhost:3002/": "mfe2"};
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "http://localhost:3005/script.js";

            expect(entry.get()).toEqual({"http://localhost:3002/": "mfe2"});
        });
    });

    describe('extended cache', () => {
        type MOCK_CACHE = NfCache & {extra_key: string}

        it('should handle values from a cache that extends the NF cache', () => {
            const entry = globalThisStorageEntry<MOCK_CACHE>('extra_key', "value1");
            expect(entry.get()).toEqual("value1");

            entry.set("value2");
            expect(entry.get()).toEqual("value2");
        });
    })
});