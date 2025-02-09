import { mockExternalsHandler } from './../../../mock/handlers.mock';
import { ExternalsHandler } from "../externals";
import { ImportMapHandler } from "./import-map.contract";
import { importMapHandlerFactory } from "./import-map.handler";

describe('importMapHandler', () => {
    let externalsHandler: ExternalsHandler;
    let importMapHandler: ImportMapHandler;

    // const REMOTE_MFE1_MOCK: () => Remote = () => 
    //     JSON.parse(JSON.stringify({
    //         name: 'team/mfe1', 
    //         shared: [
    //             {
    //                 packageName: "rxjs",
    //                 outFileName: "rxjs.js",
    //                 requiredVersion: "~7.8.0",
    //                 singleton: true,
    //                 strictVersion: true,
    //                 version: "7.8.1",
    //             }
    //         ] as SharedInfo[], 
    //         exposes: [{key: './comp', outFileName: 'comp.js'}], 
    //         baseUrl: 'http://localhost:3001'
    //     }))

    beforeEach(() => {
        externalsHandler = mockExternalsHandler();
        importMapHandler = importMapHandlerFactory(externalsHandler);
    });

    describe('create', () => {
        it('should create an empty importMap', () => {
            const expected = {imports: {}, scopes: {}};
            const actual = importMapHandler.create();
            expect(actual).toEqual(expected);
        });

        it('should create a new object every time', () => {
            const expected = {imports: {}, scopes: {}};

            const first = importMapHandler.create();
            first.imports["team/mfe1/./comp"] = "http://localhost:3001/comp.js";
            first.scopes["http://localhost:3001/"] = {
                "@angular/animations": "http://localhost:3001/_angular_animations.js"
            }

            const actual = importMapHandler.create();
            
            expect(actual).toEqual(expected);
        });

        it('should create an importMap from the given values', () => {
            const expected = {
                imports: {"mfe1": "localhost:3001/remoteEntry.json"},
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/rxjs.js"
                    }
                }
            };
            const actual = importMapHandler.create({
                imports: {"mfe1": "localhost:3001/remoteEntry.json"},
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/rxjs.js"
                    }
                }
            });
            expect(actual).toEqual(expected);
        });
    });
});