import { ForDeterminingSharedExternals } from './driver-ports/for-determining-shared-externals.port';
import { DrivingContract } from './driving-ports/driving.contract';
import { createDetermineSharedExternals } from './determine-shared-externals';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { createVersionCheck } from 'lib/3.adapters/checks/version.check';
import { LoggingConfig } from './config/log.contract';
import { ModeConfig } from './config/mode.contract';
import { NFError } from 'lib/native-federation.error';

describe('createDetermineSharedExternals', () => {
    let determineSharedExternals: ForDeterminingSharedExternals;
    let mockConfig: any;
    let mockAdapters: Pick<DrivingContract, 'versionCheck'|'sharedExternalsRepo'>;

    beforeEach(() => {
        mockConfig = {
            log: {
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                level: "debug"
            },
            latestSharedExternal: false,
            strict: false
        } as LoggingConfig & ModeConfig;
        
        mockAdapters = {
            versionCheck: createVersionCheck(),
            sharedExternalsRepo: mockSharedExternalsRepository()
        };
        
        determineSharedExternals = createDetermineSharedExternals(mockConfig, mockAdapters);
    });

    describe('default scenario\'s', () => {
        it('should set only available version to share', async () => {
            mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
                "dep-a": {
                    dirty: true,
                    versions: [{
                        version: "1.2.3", 
                        file: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "skip"
                    }]
                }
            }));

            await determineSharedExternals();

            expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
                "dep-a", 
                {
                    dirty: false,
                    versions: [{
                        version: "1.2.3", 
                        file: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "share"
                    }]
                }
            )
        });

        it('should skip if not dirty', async () => {
            mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
                "dep-a": {
                    dirty: false,
                    versions: [
                        {
                            version: "1.2.3", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~1.2.1",
                            strictVersion: false,
                            cached: false,
                            host: false,
                            action: "skip"
                        }
                    ]
                }
            }));

            await determineSharedExternals();

            expect(mockAdapters.sharedExternalsRepo.addOrUpdate).not.toHaveBeenCalled();
        });
    });

    describe('handle version incompatibilities', () => {
        it('should set "skip" if incompatible, strictVersion is false and in non-strict mode', async () => {
            mockConfig.strict = false;

            mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
                "dep-a": {
                    dirty: true,
                    versions: [
                        {
                            version: "19.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~19.0.1",
                            strictVersion: false,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                        {
                            version: "18.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~18.0.1",
                            strictVersion: false,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                    ]
                }
            }));

            await determineSharedExternals();

            expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
                "dep-a",
                {
                    dirty: false,
                    versions: [
                        {
                            version: "19.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~19.0.1",
                            strictVersion: false,
                            cached: false,
                            host: false,
                            action: "share"
                        },
                        {
                            version: "18.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~18.0.1",
                            strictVersion: false,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                    ]
                }
            )
        });


        it('should set "scoped" if incompatible, strictVersion is true and in non-strict mode', async () => {
            mockConfig.strict = false;

            mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
                "dep-a": {
                    dirty: true,
                    versions: [
                        {
                            version: "19.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~19.0.1",
                            strictVersion: true,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                        {
                            version: "18.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~18.0.1",
                            strictVersion: true,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                    ]
                }
            }));

            await determineSharedExternals();

            expect(mockAdapters.sharedExternalsRepo.addOrUpdate).toHaveBeenCalledWith(
                "dep-a",
                {
                    dirty: false,
                    versions: [
                        {
                            version: "19.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~19.0.1",
                            strictVersion: true,
                            cached: false,
                            host: false,
                            action: "share"
                        },
                        {
                            version: "18.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~18.0.1",
                            strictVersion: true,
                            cached: false,
                            host: false,
                            action: "scope"
                        },
                    ]
                }
            )
        });
        

        it('should throw error if incompatible, strictVersion is true and in strict mode', async () => {
            mockConfig.strict = true;

            mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
                "dep-a": {
                    dirty: true,
                    versions: [
                        {
                            version: "19.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~19.0.1",
                            strictVersion: true,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                        {
                            version: "18.0.1", 
                            file: "http://my.service/mfe1/dep-a.js",
                            requiredVersion: "~18.0.1",
                            strictVersion: true,
                            cached: false,
                            host: false,
                            action: "skip"
                        },
                    ]
                }
            }));

            await expect(determineSharedExternals()).rejects.toEqual(new NFError("Failed to determine shared externals."));
            
        });
    });


});
