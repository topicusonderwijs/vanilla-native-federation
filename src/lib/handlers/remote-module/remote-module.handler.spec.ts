import { NfCache, StorageHandler } from "../storage";
import { RemoteModuleHandler } from "./remote-module.contract";
import { remoteModuleHandlerFactory } from './remote-module.handler';
import { mockStorageHandler } from "../../../mock/handlers.mock";
import { NFError } from "../../native-federation.error";
import { RemoteInfo } from "../remote-info";

describe('remoteInfoHandler', () => {
    let storageHandler: StorageHandler<NfCache>;
    let remoteModuleHandler: RemoteModuleHandler;

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
        let cache: { remotes: Record<string, RemoteInfo> }

        beforeEach(() => {
            cache = { 
                remotes: { 
                    "team/mfe1": {
                        scopeUrl: "http://localhost:3001/",
                        remoteName: "team/mfe1",
                        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                    }
                },
            };
            (storageHandler.fetch as jest.Mock).mockImplementation(
                () => cache["remotes"] as Record<string, RemoteInfo>
            );
        })

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
