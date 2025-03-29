import { sessionStorageEntry } from './session-storage';
import { NfCache } from './../../lib/core/storage';
import { RemoteInfo } from '../../lib/core/remote-info';
import { NF_STORAGE_ENTRY } from '../../lib/config/namespace.contract';

describe('sessionStorageEntry', () => {

    const MOCK_REMOTE_INFO = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3001/",
        remoteName: "team/mfe1",
        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
    });

    const MOCK_REMOTE_INFO_II = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3002/",
        remoteName: "team/mfe2",
        exposes: [{moduleName: "./comp", url: "http://localhost:3002/comp.js"}]
    });

    const mocksessionStorage: any = {
        storage: {} as Record<string, string>,
        getItem: jest.fn((key: string) => mocksessionStorage.storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            mocksessionStorage.storage[key] = value;
        }),
    };

    beforeEach(() => {
        mocksessionStorage.storage = {};
        jest.clearAllMocks();
        
        Object.defineProperty(window, 'sessionStorage', { 
            value: mocksessionStorage 
        });
    });

    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO()};

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO()};

            const keyA = entry.get();
            keyA["team/mfe1"] = MOCK_REMOTE_INFO_II();

            expect(entry.get()).toEqual(expected);
        });
    })

    describe('set', () => {
        it('set stores value', () => {
            const entry = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            const expected = {"team/mfe2": MOCK_REMOTE_INFO_II()};

            entry.set({"team/mfe2": MOCK_REMOTE_INFO_II()});

            expect(entry.get()).toEqual(expected);
        });

        it('set stores value in the sessionStorage', () => {
            const entry: any = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            
            entry.set({"team/mfe2": MOCK_REMOTE_INFO_II()});
            const actual = mocksessionStorage.storage[NF_STORAGE_ENTRY+".remotes"]

            expect(actual).toEqual("{\"team/mfe2\":{\"scopeUrl\":\"http://localhost:3002/\",\"remoteName\":\"team/mfe2\",\"exposes\":[{\"moduleName\":\"./comp\",\"url\":\"http://localhost:3002/comp.js\"}]}}");
        });

        it('maintains separate values for different keys', () => {
            const entry1 = sessionStorageEntry('externals', {
                global:{
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js"}
                }
            });
            const entry2 = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            
            entry1.set({
                global:{
                    "tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url: "http://localhost:3001/tslib.js"}
                }
            });
            entry2.set({ "team/mfe2": MOCK_REMOTE_INFO_II() });
            
            expect(entry1.get()).toEqual({
                global:{
                    "tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url: "http://localhost:3001/tslib.js"}
                }
            });
            expect(entry2.get()).toEqual({ "team/mfe2": MOCK_REMOTE_INFO_II() });
        });

        it('not allow any mutations', () => {
            const entry = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            const newEntry = {"team/mfe2": MOCK_REMOTE_INFO_II()} as any;
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "BAD_SCRIPT.js";

            expect(entry.get()).toEqual({"team/mfe2": MOCK_REMOTE_INFO_II()});
        });
    });

    describe('extended cache', () => {
        type MOCK_CACHE = NfCache & {extra_key: string}

        it('should handle values from a cache that extends the NF cache', () => {
            const entry = sessionStorageEntry<MOCK_CACHE>('extra_key', "value1");
            expect(entry.get()).toEqual("value1");

            entry.set("value2");
            expect(entry.get()).toEqual("value2");
        });
    })
});
