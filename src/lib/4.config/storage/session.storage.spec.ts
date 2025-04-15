import { NF_STORAGE_ENTRY } from "../../2.app/config/storage.contract";
import { RemoteInfo } from "../../1.domain/remote/remote-info.contract";
import { sessionStorageEntry } from './session.storage';

describe('sessionStorageEntry', () => {

    const MOCK_REMOTE_INFO = (): RemoteInfo => ({
        scopeUrl: "http://sessionhost:3001/",
        remoteName: "team/mfe1",
        exposes: [{moduleName: "./comp", url: "http://sessionhost:3001/comp.js"}]
    });

    const MOCK_REMOTE_INFO_II = (): RemoteInfo => ({
        scopeUrl: "http://sessionhost:3002/",
        remoteName: "team/mfe2",
        exposes: [{moduleName: "./comp", url: "http://sessionhost:3002/comp.js"}]
    });

    const mockSessionStorage: any = {
        storage: {} as Record<string, string>,
        getItem: jest.fn((key: string) => mockSessionStorage.storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            mockSessionStorage.storage[key] = value;
        }),
    };

    beforeEach(() => {
        mockSessionStorage.storage = {};        
        Object.defineProperty(window, 'sessionStorage', { 
            value: mockSessionStorage 
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    it('Don\'t create storage until asked for', () => {
        sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});

        expect((mockSessionStorage.storage as any)[NF_STORAGE_ENTRY]).toEqual(undefined);
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
        it('set stores value in namespace', () => {
            const entry = sessionStorageEntry<Record<string, RemoteInfo>>('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            const expected = {"team/mfe2": MOCK_REMOTE_INFO_II()};

            entry.set({"team/mfe2": MOCK_REMOTE_INFO_II()});

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = sessionStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            const newEntry = {"team/mfe2": MOCK_REMOTE_INFO_II()} as any;
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "BAD_SCRIPT.js";

            expect(entry.get()).toEqual({"team/mfe2": MOCK_REMOTE_INFO_II()});
        });
    });
});