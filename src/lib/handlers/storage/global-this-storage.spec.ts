import { globalThisStorageEntry, createGlobalThisStorageCache, type GlobalThisStorage } from './global-this-storage';
import { nfNamespace } from './storage.contract';

describe('globalThisStorageEntry', () => {
    beforeEach(() => {
        delete (globalThis as unknown as Partial<GlobalThisStorage>)[nfNamespace];
    });

    it('creates namespace if it does not exist', () => {
        globalThisStorageEntry('key1', 'fallback');
        expect((globalThis as unknown as GlobalThisStorage)[nfNamespace]).toEqual({});
    });

    it('returns entry with get/set/exists methods', () => {
        const entry = globalThisStorageEntry('key1', 'fallback');
        expect(typeof entry.get).toBe('function');
        expect(typeof entry.set).toBe('function');
        expect(typeof entry.exists).toBe('function');
    });


    describe('get', () => {
        it('get returns fallback when value not set', () => {
            const entry = globalThisStorageEntry('key1', 'fallback');
            expect(entry.get()).toBe('fallback');
        });
    })

    describe('set', () => {
        it('set stores value in globalThis namespace', () => {
            const entry = globalThisStorageEntry('key1', 'fallback1');
            entry.set('newValue');
            expect(entry.get()).toBe('newValue');
        });
    });

    describe('exists', () => {
        it('exists returns false when key not present', () => {
            const entry = globalThisStorageEntry('key1', 'fallback');
            expect(entry.exists()).toBe(false);
        });
    
        it('exists returns true after setting value', () => {
            const entry = globalThisStorageEntry('key1', 'fallback');
            entry.set('value');
            expect(entry.exists()).toBe(true);
        });
    });

    it('maintains separate values for different keys', () => {
        const entry1 = globalThisStorageEntry('key1', 'fallback1');
        const entry2 = globalThisStorageEntry('key2', 'fallback2');
        
        entry1.set('value1');
        entry2.set('value2');
        
        expect(entry1.get()).toBe('value1');
        expect(entry2.get()).toBe('value2');
    });
});

describe('createGlobalThisStorageCache', () => {

    beforeEach(() => {
        delete (globalThis as unknown as Partial<GlobalThisStorage>)[nfNamespace];
    });

    it('returns storage object with correct structure', () => {
        const cache = {
            externals: { test: 'value' },
            remoteNamesToRemote: {},
            baseUrlToRemoteNames: {}
        };

        const storage = createGlobalThisStorageCache(cache);

        expect(storage.externals.get()).toEqual({ test: 'value' });
        expect(storage.remoteNamesToRemote.get()).toEqual({});
        expect(storage.baseUrlToRemoteNames.get()).toEqual({});
    });
});