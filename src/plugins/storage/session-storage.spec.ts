import { sessionStorageEntry } from './session-storage';
import { NfCache, nfNamespace } from './../../lib/handlers/storage';

describe('sessionStorageEntry', () => {

    const mockSessionStorage: any = {
        storage: {} as Record<string, string>,
        getItem: jest.fn((key: string) => mockSessionStorage.storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            mockSessionStorage.storage[key] = value;
        }),
    };

    beforeEach(() => {
        mockSessionStorage.storage = {};
        jest.clearAllMocks();
        
        Object.defineProperty(window, 'sessionStorage', { 
            value: mockSessionStorage 
        });
    });
    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = sessionStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const expected = entry.get();

            expect(expected).toEqual({
                    "rxjs@7.8.1": "http://localhost:3001/rxjs.js"
            });
        });

        it('not allow any mutations', () => {
            const entry = sessionStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const keyA = entry.get();
            keyA["tslib@2.8.1"] = "http://localhost:3001/tslib.js";
             
            const expected = entry.get();

            expect(expected).toEqual({
                "rxjs@7.8.1": "http://localhost:3001/rxjs.js"
            });
        });
    })

    describe('set', () => {
        it('set stores value', () => {
            const entry = sessionStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            entry.set({"tslib@2.8.1": "http://localhost:3001/tslib.js"});

            expect(entry.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
        });

        it('set stores value in the sessionStorage', () => {
            const entry: any = sessionStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            

            entry.set({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
            const actual = mockSessionStorage.storage[nfNamespace+".externals"]

            expect(actual).toEqual("{\"tslib@2.8.1\":\"http://localhost:3001/tslib.js\"}");
        });

        it('maintains separate values for different keys', () => {
            const entry1 = sessionStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const entry2 = sessionStorageEntry('baseUrlToRemoteNames', { "http://localhost:3001": "team/mfe1" });
            
            entry1.set({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
            entry2.set({ "http://localhost:3002": "team/mfe2" });
            
            expect(entry1.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
            expect(entry2.get()).toEqual({ "http://localhost:3002": "team/mfe2" });
        });

        it('not allow any mutations', () => {
            const entry = sessionStorageEntry('externals', {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            const newEntry: Record<string, string> = {"tslib@2.8.1": "http://localhost:3001/tslib.js"};
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "http://localhost:3005/script.js";

            expect(entry.get()).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});
        });
    });

    describe('extended cache', () => {
        type MOCK_CACHE = NfCache & {extrakey: string}

        it('should handle values from a cache that extends the NF cache', () => {
            const entry = sessionStorageEntry<MOCK_CACHE>('extrakey', "value1");
            expect(entry.get()).toEqual("value1");

            entry.set("value2");
            expect(entry.get()).toEqual("value2");
        });
    })
});