import type { ExternalsScope } from '../../1.domain/externals/externals.contract';
import { createExternalsRepository } from './externals.repository';
import { Optional } from '../../utils/optional';
import type { Version } from '../../1.domain/externals/version.contract';
import type { StorageEntry, StorageConfig } from './storage.contract';
import type { ForStoringExternals } from '../../2.app/driving-ports/for-storing-externals.port';

describe('createExternalsRepository', () => {
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;
    let externalsRepository: ForStoringExternals;

    const MOCK_VERSION  = (): Version => ({
        version: "7.8.1", 
        url: "http://localhost:3001/shared-dep-A.js"
    });

    // const MOCK_SHARED_VERSION  = (): SharedVersion => ({
    //     version: "1.2.3", 
    //     requiredVersion: "~1.2.1", 
    //     strictVersion: true,
    //     action: "share",
    //     url: "http://localhost:3001/shared-dep-B.js"
    // });

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

        externalsRepository = createExternalsRepository(mockStorageConfig);
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalled();
            expect(mockStorage["externals"]).toEqual({
                "shared": {},
                "scoped": {}
            });

        });
    })

    describe('tryGetScope', () => {
        it('should return the scope', () => {
            mockStorage["externals"]["scoped"]["scope"] = {"dep-a": MOCK_VERSION()};

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
            mockStorage["externals"]["scoped"]["scope-a"]  = {"dep-a": MOCK_VERSION()};

            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope-b");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

});