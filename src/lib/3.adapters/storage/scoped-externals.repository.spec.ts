import type { ExternalsScope } from '../../1.domain/externals/externals.contract';
import { createScopedExternalsRepository } from './scoped-externals.repository';
import { Optional } from '../../utils/optional';
import type { Version } from '../../1.domain/externals/version.contract';
import type { StorageEntry, StorageConfig } from './storage.contract';
import type { ForStoringScopedExternals } from '../../2.app/driving-ports/for-storing-scoped-externals.port';

describe('createScopedExternalsRepository', () => {
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;
    let externalsRepository: ForStoringScopedExternals;

    const MOCK_VERSION  = (): Version => ({
        version: "7.8.1", 
        url: "http://localhost:3001/shared-dep-A.js"
    });

    beforeEach(() => {
        mockStorage = {};

        mockStorageConfig = {
            toStorageEntry: jest.fn(
                <TValue> (key: string, initialValue: TValue) => {
                    mockStorage[key] = initialValue;

                    const mockStorageEntry = {
                        get: jest.fn(() => mockStorage[key]),
                        set: jest.fn((value) => {
                            mockStorage[key] = value;
                            return mockStorageEntry;
                        })
                    } as StorageEntry<any>;

                    return mockStorageEntry;
                }
            )
        };

        externalsRepository = createScopedExternalsRepository(mockStorageConfig);
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalled();
            expect(mockStorage["scoped-externals"]).toEqual({ });

        });
    })

    describe('tryGetScope', () => {
        it('should return the scope', () => {
            mockStorage["scoped-externals"]["scope"] = {"dep-a": MOCK_VERSION()};

            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual({"dep-a": MOCK_VERSION()});
        });

        it('should return empty optional if scope doesnt exist', () => {
            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other scopes exist', () => {
            mockStorage["scoped-externals"]["scope-a"]  = {"dep-a": MOCK_VERSION()};

            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope-b");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

});