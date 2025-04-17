import { NF_STORAGE_ENTRY } from "../../2.app/config/storage.contract";
import { RemoteInfo } from "../../1.domain/remote/remote-info.contract";
import { localStorageEntry } from './local.storage';
import { MOCK_REMOTE_INFO_I, MOCK_REMOTE_INFO_II } from "../../6.mocks/domain/remote-info/remote-info.mock";

describe('localStorageEntry', () => {

    const mockLocalStorage: any = {
        storage: {} as Record<string, string>,
        getItem: jest.fn((key: string) => mockLocalStorage.storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            mockLocalStorage.storage[key] = value;
        }),
    };

    beforeEach(() => {
        mockLocalStorage.storage = {};        
        Object.defineProperty(window, 'localStorage', { 
            value: mockLocalStorage 
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    it('Don\'t create storage until asked for', () => {
        localStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});

        expect((mockLocalStorage.storage as any)[NF_STORAGE_ENTRY]).toEqual(undefined);
    });

    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = localStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO_I()};

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = localStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO_I()};

            const keyA = entry.get()!;
            keyA["team/mfe1"] = MOCK_REMOTE_INFO_II();

            expect(entry.get()).toEqual(expected);
        });
    })

    describe('set', () => {
        it('set stores value in namespace', () => {
            const entry = localStorageEntry<Record<string, RemoteInfo>>('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});
            const expected = {"team/mfe2": MOCK_REMOTE_INFO_II()};

            entry.set({"team/mfe2": MOCK_REMOTE_INFO_II()});

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = localStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});
            const newEntry = {"team/mfe2": MOCK_REMOTE_INFO_II()} as any;
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "BAD_SCRIPT.js";

            expect(entry.get()).toEqual({"team/mfe2": MOCK_REMOTE_INFO_II()});
        });
    });
});