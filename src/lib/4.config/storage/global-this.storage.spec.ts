import { NF_STORAGE_ENTRY } from "../../2.app/config/storage.contract";
import { RemoteInfo } from "../../1.domain/remote/remote-info.contract";
import { globalThisStorageEntry } from './global-this.storage';
import { MOCK_REMOTE_INFO_I, MOCK_REMOTE_INFO_II } from "../../6.mocks/domain/remote-info/remote-info.mock";

describe('globalThisStorageEntry', () => {

    beforeEach(() => {
        delete (globalThis as any)[NF_STORAGE_ENTRY];
    });

    it('creates namespace if it does not exist', () => {
        globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});

        expect((globalThis as any)[NF_STORAGE_ENTRY]).toEqual({
            "remotes": {"team/mfe1": MOCK_REMOTE_INFO_I()}
        });
    });

    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO_I()};

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO_I()};

            const keyA = entry.get()!;
            keyA["team/mfe1"] = MOCK_REMOTE_INFO_II();

            expect(entry.get()).toEqual(expected);
        });
    })

    describe('set', () => {
        it('set stores value in globalThis namespace', () => {
            const entry = globalThisStorageEntry<Record<string, RemoteInfo>>('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});
            const expected = {"team/mfe2": MOCK_REMOTE_INFO_II()};

            entry.set({"team/mfe2": MOCK_REMOTE_INFO_II()});

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO_I()});
            const newEntry = {"team/mfe2": MOCK_REMOTE_INFO_II()} as any;
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "BAD_SCRIPT.js";

            expect(entry.get()).toEqual({"team/mfe2": MOCK_REMOTE_INFO_II()});
        });
    });

    describe('clear', () => {
        it('clears the entry back to the initialValue', () => {
            (globalThis as any)[NF_STORAGE_ENTRY] = {};
            (globalThis as any)[NF_STORAGE_ENTRY]["remotes"] = {"team/mfe1": MOCK_REMOTE_INFO_I()};
            
            const entry = globalThisStorageEntry<Record<string, RemoteInfo>>('remotes', {});

            expect(entry.get()).toEqual({"team/mfe1": MOCK_REMOTE_INFO_I()});

            entry.clear();

            expect(entry.get()).toEqual({});
        });
    });
});