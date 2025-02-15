import { ExposesInfo, SharedInfo } from "@softarc/native-federation-runtime";
import { NfCache, StorageHandler } from "../storage";
import { RemoteModuleHandler } from "./remote-module.contract";
import { remoteModuleHandlerFactory } from './remote-module.handler';
import { mockStorageHandler } from "../../../mock/handlers.mock";
import { NFError } from "../../native-federation.error";

describe('remoteInfoHandler', () => {
    let storageHandler: StorageHandler<NfCache>;
    let remoteModuleHandler: RemoteModuleHandler;

    const MOCK_SHARED_INFO = (): SharedInfo[] => 
        [
            {
                packageName: "rxjs",
                outFileName: "rxjs.js",
                requiredVersion: "~7.8.0",
                singleton: true,
                strictVersion: true,
                version: "7.8.1",
            }
        ] as SharedInfo[]

   const MOCK_FEDERATION_INFO = (): {name: string, exposes: ExposesInfo[]} => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            exposes: [{key: './comp', outFileName: 'comp.js'}]
        }))



    const MOCK_FEDERATION_INFO_II = (): {name: string, exposes: ExposesInfo[]} => 
            JSON.parse(JSON.stringify({
                name: 'team/mfe2', 
                exposes: [{key: './comp', outFileName: 'comp.js'}]
            }))

    beforeEach(() => {
        storageHandler = mockStorageHandler();
        remoteModuleHandler = remoteModuleHandlerFactory(
            {
                builderType: "default",
                loadModuleFn: jest.fn(),
                importMapType: "importmap"
            },
            storageHandler
        );
    });

    describe('fromStorage', () => {
        it('should fetch the remote module from storage', () => {
            const expected = {moduleName: "./comp", url: "http://localhost:3001/comp.js"};
        
            const actual = remoteModuleHandler.fromStorage("team/mfe1", "./comp");
        
            expect(actual).toEqual(expected);
        }); 
        
        it('should reject if remoteName is not in storage', async () => {
            const actual = () => remoteModuleHandler.fromStorage("team/UNKNOWN-MFE", "./comp");
        
            expect(actual).toThrow(NFError);
            await expect(actual).toThrow("Remote 'team/UNKNOWN-MFE' not found in storage.");
        });  
        
        it('should reject if exposedModule is not in storage', async () => {
            const actual = () => remoteModuleHandler.fromStorage("team/mfe1", "./UNKNOWN-COMP");
        
            expect(actual).toThrow(NFError);
            expect(actual).toThrow("Exposed module './UNKNOWN-COMP' from remote 'team/mfe1' not found in storage.");
        });  
    });
});
