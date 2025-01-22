import { exposedModuleHandlerFactory } from './exposed-module.handler';
import { ExposedModuleHandler } from './exposed-module.contract';
import { logHandlerMock } from '../../../mock/log.mock';
import { Remote } from '../remote-info';
import { SharedInfo } from '@softarc/native-federation-runtime';
import { NFError } from '../../native-federation.error';

describe('appendImportMapToDOM', () => {
    let exposedModuleHandler: ExposedModuleHandler;

    const REMOTE_MFE1_MOCK: () => Remote = () => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            shared: [] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'main.js'}], 
            baseUrl: 'http://localhost:3001/mfe1'
        }))

    beforeEach(() => {
        exposedModuleHandler = exposedModuleHandlerFactory(
            logHandlerMock
        );
    });

    describe('mapFrom', () => {
        it('should map from a remoteName and exposedModule to an ExposedModule', () => {
            const expected = {remoteName: "team/mfe1", exposedModule: "./comp"};

            const actual = exposedModuleHandler.mapFrom("team/mfe1", "./comp");

            expect(actual).toEqual(expected);
        });

        it('should map from an ExposedModule to an ExposedModule', () => {
            const expected = {remoteName: "team/mfe1", exposedModule: "./comp"};

            const actual = exposedModuleHandler.mapFrom({remoteName: "team/mfe1", exposedModule: "./comp"});

            expect(actual).toEqual(expected);
        });

        it('should return the ExposedModule without alterations', () => {
            const expected = {remoteName: "team/mfe1", exposedModule: "./comp"};

            const actual = exposedModuleHandler.mapFrom({remoteName: "team/mfe1", exposedModule: "./comp"}, "./other-comp");

            expect(actual).toEqual(expected);
        });

        it('should return the ExposedModule with exposedModule if missing and provided as second param', () => {
            const expected = {remoteName: "team/mfe1", exposedModule: "./comp"};

            const actual = exposedModuleHandler.mapFrom({remoteName: "team/mfe1", exposedModule: undefined} as any, "./comp");

            expect(actual).toEqual(expected);
        });

        it('should throw an error if only remoteName is provided', () => {

            const actual = () => exposedModuleHandler.mapFrom("team/mfe1");

            expect(actual).toThrow(NFError);
            expect(actual).toThrow("Could not map exposedModule");
        });
    }),

    describe('getUrl', () => {
        it('Should return the Url of the exposed module', () => {
            const remote: Remote = REMOTE_MFE1_MOCK();
            const expected = "http://localhost:3001/mfe1/main.js";

            const actual = exposedModuleHandler.getUrl(remote, "./comp");

            expect(actual).toEqual(expected);
        });

        it('Should throw an error if module is not exposed', () => {
            const remote: Remote = REMOTE_MFE1_MOCK();
            const exposedModule = "./other-comp";

            const actual = () => exposedModuleHandler.getUrl(remote, exposedModule)

            expect(actual).toThrow(NFError);
            expect(actual).toThrow("Failed to load remote module");
        });
    })
});