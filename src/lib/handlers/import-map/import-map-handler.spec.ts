import { ImportMap, SharedInfo } from "@softarc/native-federation-runtime";
import { mockSharedInfoHandler } from './../../../mock/handlers.mock';
import { SharedInfoHandler } from "../shared-info";
import { ImportMapHandler } from "./import-map.contract";
import { importMapHandlerFactory } from "./import-map.handler";
import { Remote } from "../remote-info/remote-info.contract";

describe('importMapHandler', () => {
    let sharedInfoHandler: SharedInfoHandler;
    let importMapHandler: ImportMapHandler;

    const REMOTE_MFE1_MOCK: () => Remote = () => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            shared: [
                {
                    packageName: "rxjs",
                    outFileName: "rxjs.js",
                    requiredVersion: "~7.8.0",
                    singleton: true,
                    strictVersion: true,
                    version: "7.8.1",
                }
            ] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'comp.js'}], 
            baseUrl: 'http://localhost:3001'
        }))

    beforeEach(() => {
        sharedInfoHandler = mockSharedInfoHandler();
        importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    });

    describe('createEmpty', () => {
        it('should create an empty importMap', () => {
            const expected = {imports: {}, scopes: {}};
            const actual = importMapHandler.createEmpty();
            expect(actual).toEqual(expected);
        });

        it('should create a new object every time', () => {
            const expected = {imports: {}, scopes: {}};

            const first = importMapHandler.createEmpty();
            first.imports["team/mfe1/./comp"] = "http://localhost:3001/comp.js";
            first.scopes["http://localhost:3001/"] = {
                "@angular/animations": "http://localhost:3001/_angular_animations.js"
            }

            const actual = importMapHandler.createEmpty();
            
            expect(actual).toEqual(expected);
        });
    });

    describe('merge', () => {
        it('should merge 2 empty maps', () => {
            const mapA: ImportMap = {imports: {}, scopes: {}};
            const mapB: ImportMap = {imports: {}, scopes: {}};
            const expected = {imports: {}, scopes: {}};

            const actual = importMapHandler.merge([mapA, mapB]);

            expect(actual).toEqual(expected);
        });

        it('should not remove properties', () => {
            const mapA: ImportMap = {
                imports: {"team/mfe1/./comp": "http://localhost:3001/comp.js"}, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/mfe1/rxjs.js"
                    },
                }
            };
            const mapB = {imports: {}, scopes: {}};

            const expected = {
                imports: {"team/mfe1/./comp": "http://localhost:3001/comp.js"}, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/mfe1/rxjs.js"
                    },
                }
            };

            const actual = importMapHandler.merge([mapA, mapB]);

            expect(actual).toEqual(expected);
        });

        it('should merge imports and scopes', () => {
            const mapA: ImportMap = {
                imports: {"team/mfe1/./comp": "http://localhost:3001/comp.js"}, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/mfe1/rxjs.js"
                    },
                }
            };
            const mapB = {
                imports: {"team/mfe2/./comp": "http://localhost:3002/comp.js"}, 
                scopes: {
                    "http://localhost:3002/": {
                        "rxjs/operators": "http://localhost:3002/mfe1/rxjs.js"
                    },
                }
            };

            const expected = {
                imports: {
                    "team/mfe1/./comp": "http://localhost:3001/comp.js",
                    "team/mfe2/./comp": "http://localhost:3002/comp.js",
                }, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/mfe1/rxjs.js"
                    },
                    "http://localhost:3002/": {
                        "rxjs/operators": "http://localhost:3002/mfe1/rxjs.js"
                    },
                }
            };

            const actual = importMapHandler.merge([mapA, mapB]);

            expect(actual).toEqual(expected);
        });

        it('should merge 3 maps', () => {
            const mapA: ImportMap = {
                imports: {"team/mfe1/./comp": "http://localhost:3001/comp.js"}, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/rxjs.js"
                    },
                }
            };
            const mapB = {
                imports: {"team/mfe2/./comp": "http://localhost:3002/comp.js"}, 
                scopes: {
                    "http://localhost:3002/": {
                        "rxjs/operators": "http://localhost:3002/rxjs.js"
                    },
                }
            };
            const mapC = {
                imports: {"team/mfe3/./comp": "http://localhost:3003/comp.js"}, 
                scopes: {
                    "http://localhost:3003/": {
                        "tslib": "http://localhost:3003/tslib.js"                    
                    },
                }
            };

            const expected = {
                imports: {
                    "team/mfe1/./comp": "http://localhost:3001/comp.js",
                    "team/mfe2/./comp": "http://localhost:3002/comp.js",
                    "team/mfe3/./comp": "http://localhost:3003/comp.js",
                }, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/rxjs.js"
                    },
                    "http://localhost:3002/": {
                        "rxjs/operators": "http://localhost:3002/rxjs.js"
                    },
                    "http://localhost:3003/": {
                        "tslib": "http://localhost:3003/tslib.js"
                    },
                }
            };

            const actual = importMapHandler.merge([mapA, mapB, mapC]);

            expect(actual).toEqual(expected);
        });
    });

    describe('toImportMap', () => {
        it('should return with shared deps', () => {
            const expected: ImportMap = {
                imports: {"team/mfe1/./comp": "http://localhost:3001/comp.js"}, 
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/rxjs.js"
                    },
                }
            };
            (sharedInfoHandler.mapSharedDeps as jest.Mock).mockReturnValue({
                "rxjs": "http://localhost:3001/rxjs.js"
            });

            const actual = importMapHandler.toImportMap(REMOTE_MFE1_MOCK());
            expect(actual).toEqual(expected);
        });

        it('should return without shared deps', () => {
            const expected: ImportMap = {
                imports: {"team/mfe1/./comp": "http://localhost:3001/comp.js"}, 
                scopes: {
                    "http://localhost:3001/": {}
                }
            };

            (sharedInfoHandler.mapSharedDeps as jest.Mock).mockReturnValue({ });

            const actual = importMapHandler.toImportMap({
                name: 'team/mfe1', 
                shared: [] as SharedInfo[], 
                exposes: [{key: './comp', outFileName: 'comp.js'}], 
                baseUrl: 'http://localhost:3001'
            });
            expect(actual).toEqual(expected);
        });
    });
});