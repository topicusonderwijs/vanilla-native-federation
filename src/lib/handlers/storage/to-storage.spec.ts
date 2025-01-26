import { toStorage } from './to-storage';
import type { StorageEntry, StorageEntryCreator, StorageOf } from './storage.contract';

describe('toStorage', () => {

    describe('simple string key-value types', () => {
        let mockStorageEntryCreator: StorageEntryCreator;
        let mockStorageEntry: StorageEntry<string>;

        beforeEach(() => {
            mockStorageEntry = {
                set: jest.fn(),
                get: jest.fn(),
                exists: jest.fn()
            };
            mockStorageEntryCreator = jest.fn().mockReturnValue(mockStorageEntry);
        });

        it('should create storage entries for all properties', () => {
            const input = {
                key1: 'value1',
                key2: 'value2'
            } as Record<string, string>;
            const expected = {
                key1: mockStorageEntry,
                key2: mockStorageEntry
            } as StorageOf<Record<string, string>>
    
            const result = toStorage(input, mockStorageEntryCreator);
    
            expect(mockStorageEntryCreator).toHaveBeenCalledTimes(2);
            expect(mockStorageEntryCreator).toHaveBeenCalledWith('key1', 'value1');
            expect(mockStorageEntryCreator).toHaveBeenCalledWith('key2', 'value2');
            
            expect(result).toEqual(expected);
        });
    
        it('should handle empty object input', () => {
            const input = {} as Record<string, string>;
            const result = toStorage(input, mockStorageEntryCreator);
            const expected = {} as StorageOf<Record<string, string>>

            expect(mockStorageEntryCreator).not.toHaveBeenCalled();
            expect(result).toEqual(expected);
        });
    

    
        it('should preserve property names in output', () => {
            const input = {
                'complex-key': 'value1',
                '_underscore': 'value2',
                '$special': 'value3'
            } as Record<string, string>;

            const result = toStorage(input, mockStorageEntryCreator);
    
            expect(Object.keys(result)).toEqual(['complex-key', '_underscore', '$special']);
            expect(mockStorageEntryCreator).toHaveBeenCalledTimes(3);
        });
    })

    describe('Complex types', () => {
        let mockStorageEntryCreator: StorageEntryCreator;
        let mockArrayStorageEntry: StorageEntry<number[]>;
        let mockNestedStorageEntry: StorageEntry<{foo: string}>;

        beforeEach(() => {
            mockArrayStorageEntry = {
                set: jest.fn(),
                get: jest.fn(),
                exists: jest.fn()
            };
            mockNestedStorageEntry = {
                set: jest.fn(),
                get: jest.fn(),
                exists: jest.fn()
            };

            mockStorageEntryCreator = jest.fn().mockImplementation((key, _) => 
                key === 'array' ? mockArrayStorageEntry : mockNestedStorageEntry
            );  
        });

        it('should handle complex nested values', () => {
            const input = {
                nested: { foo: 'bar' },
                array: [1, 2, 3]
            };
    
            const result = toStorage(input, mockStorageEntryCreator);
    
            expect(mockStorageEntryCreator).toHaveBeenCalledTimes(2);
            expect(mockStorageEntryCreator).toHaveBeenCalledWith('nested', { foo: 'bar' });
            expect(mockStorageEntryCreator).toHaveBeenCalledWith('array', [1, 2, 3]);

            expect(result).toEqual({
                nested: mockNestedStorageEntry,
                array: mockArrayStorageEntry
            });
        });

    });


   
});