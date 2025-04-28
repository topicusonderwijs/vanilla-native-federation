

import { ForExposingModuleLoader } from './driver-ports/for-exposing-module-loader.port';
import { DrivingContract } from './driving-ports/driving.contract';
import { createExposeModuleLoader } from './expose-module-loader';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { mockBrowser } from "lib/6.mocks/adapters/browser.mock";
import { LoggingConfig } from './config/log.contract';
import { Optional } from "lib/utils/optional";
import { NFError } from 'lib/native-federation.error';

describe('createExposeModuleLoader', () => {
    let exposeModuleLoader: ForExposingModuleLoader;
    let mockAdapters: Pick<DrivingContract, 'remoteInfoRepo' | 'browser'>;
    let mockConfig: LoggingConfig;

    beforeEach(() => {
        mockConfig = {
            log: {
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                level: "debug"
            }
        } as LoggingConfig;

        mockAdapters = {
            remoteInfoRepo: mockRemoteInfoRepository(),
            browser: mockBrowser()
        };

        mockAdapters.remoteInfoRepo.getAll = jest.fn(() => ({}));

        exposeModuleLoader = createExposeModuleLoader(mockConfig, mockAdapters);
    });

    it('should load a remote module if in storage', async () => {
        mockAdapters.remoteInfoRepo.contains = jest.fn(() => true);
        mockAdapters.remoteInfoRepo.tryGetModule = jest.fn((): Optional<string> => Optional.of("http://my.service/mfe1/component-a.js"));

        const loadRemoteModule = await exposeModuleLoader();

        await loadRemoteModule("team/mfe1", "./component-a");

        expect(mockAdapters.browser.importModule).toHaveBeenCalledWith("http://my.service/mfe1/component-a.js");
    });

    it('should throw an error if remote-info is not in storage', async () => {
        mockAdapters.remoteInfoRepo.contains = jest.fn(() => false);

        const loadRemoteModule = await exposeModuleLoader();

        await expect(loadRemoteModule("team/mfe1", "./comp-a"))
            .rejects.toEqual(new NFError("Failed to load module team/mfe1/./comp-a"));

        expect(mockConfig.log.error).toHaveBeenCalledWith(
            "Failed to load module team/mfe1/./comp-a: ",
            new NFError("Remote 'team/mfe1' is not initialized.")
        )
    });

    it('should throw an error if remote-info doesnt contain the module', async () => {
        mockAdapters.remoteInfoRepo.contains = jest.fn(() => true);
        mockAdapters.remoteInfoRepo.tryGetModule = jest.fn((): Optional<string> => Optional.empty());

        const loadRemoteModule = await exposeModuleLoader();

        await expect(loadRemoteModule("team/mfe1", "./comp-a"))
            .rejects.toEqual(new NFError("Failed to load module team/mfe1/./comp-a"));

        expect(mockConfig.log.error).toHaveBeenCalledWith(
            "Failed to load module team/mfe1/./comp-a: ",
            new NFError("Exposed module './comp-a' from remote 'team/mfe1' not found in storage.")
        )
    });
});