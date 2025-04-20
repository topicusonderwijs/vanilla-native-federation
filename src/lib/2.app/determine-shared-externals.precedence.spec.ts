import { ForDeterminingSharedExternals } from './driver-ports/for-determining-shared-externals.port';
import { DrivingContract } from './driving-ports/driving.contract';
import { createDetermineSharedExternals } from './determine-shared-externals';
import { mockSharedExternalsRepository } from '../6.mocks/adapters/shared-externals.repository.mock';
import { createVersionCheck } from '../3.adapters/checks/version.check';
import { LoggingConfig } from './config/log.contract';
import { ModeConfig } from './config/mode.contract';


/**
 * This tests the precedence of the different external versions
 */
describe('createDetermineSharedExternals (compatibility precedence)', () => {
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

    it('should set the host version if available', async () => {
        mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
            "dep-a": {
                dirty: true,
                versions: [
                    {
                        version: "1.2.3", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "1.2.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: true,
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
                        version: "1.2.3", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "1.2.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: true,
                        action: "share"
                    },
                ]
            }
        )
    });

    it('should set the latest version if all equal', async () => {
        mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
            "dep-a": {
                dirty: true,
                versions: [
                    {
                        version: "1.2.3", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "1.2.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
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
                        version: "1.2.3", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "share"
                    },
                    {
                        version: "1.2.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~1.2.1",
                        strictVersion: false,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                ]
            }
        )
    });


    it('Should choose latest most compatible version if no host version available', async () => {
        mockConfig.strict = false;

        mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
            "dep-a": {
                dirty: true,
                versions: [
                    {
                        version: "19.0.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~19.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "18.0.2", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~18.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "18.0.1", 
                        url: "http://my.service/mfe1/dep-a.js",
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
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~19.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "scope" // because 18.0.1 and 18.0.2 are compatible, this version will be excluded
                    },
                    {
                        version: "18.0.2", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~18.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "share"
                    },
                    {
                        version: "18.0.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~18.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                ]
            }
        )
    });


    it('Should prioritize latest version if config is enabled', async () => {
        mockConfig.strict = false;
        mockConfig.latestSharedExternal = true;

        mockAdapters.sharedExternalsRepo.getAll = jest.fn(() => ({
            "dep-a": {
                dirty: true,
                versions: [
                    {
                        version: "19.0.1", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~19.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "18.0.2", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~18.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "skip"
                    },
                    {
                        version: "18.0.1", 
                        url: "http://my.service/mfe1/dep-a.js",
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
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~19.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "share" // Prioritizes latest version because it was defined in the config
                    },
                    {
                        version: "18.0.2", 
                        url: "http://my.service/mfe1/dep-a.js",
                        requiredVersion: "~18.0.1",
                        strictVersion: true,
                        cached: false,
                        host: false,
                        action: "scope"
                    },
                    {
                        version: "18.0.1", 
                        url: "http://my.service/mfe1/dep-a.js",
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

});
