import { globalThisStorageEntry } from './global-this-storage';
import { NfCache, nfNamespace } from './storage.contract';

describe('globalThisStorageEntry', () => {
    // type MOCK_CACHE = NfCache & {key1: string, key2: string}

    beforeEach(() => {
        delete (globalThis as any)[nfNamespace];
    });

    it('creates namespace if it does not exist', () => {
        globalThisStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
        expect((globalThis as any)[nfNamespace]).toEqual({
            "externals": {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"}
        });
    });

    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = globalThisStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const expected = entry.get();

            expect(expected).toEqual({
                    "rxjs@7.8.1": "http://localhost:3001/rxjs.js"
            });
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const keyA = entry.get();
            keyA["tslib@2.8.1"] = "http://localhost:3001/tslib.js";
             
            const expected = entry.get();

            expect(expected).toEqual({
                    "rxjs@7.8.1": "http://localhost:3001/rxjs.js"
            });
        });
    })

    describe('set', () => {
        it('set stores value in globalThis namespace', () => {
            const entry = globalThisStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            entry.set({"tslib@2.8.1": "http://localhost:3001/tslib.js"});

            expect(entry.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
        });

        it('maintains separate values for different keys', () => {
            const entry1 = globalThisStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const entry2 = globalThisStorageEntry('baseUrlToRemoteNames', { "http://localhost:3001": "team/mfe1" });
            
            entry1.set({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
            entry2.set({ "http://localhost:3002": "team/mfe2" });
            
            expect(entry1.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
            expect(entry2.get()).toEqual({ "http://localhost:3002": "team/mfe2" });
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const newEntry: Record<string, string> = {"tslib@2.8.1": "http://localhost:3001/tslib.js"};
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "http://localhost:3005/script.js";

            expect(entry.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
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