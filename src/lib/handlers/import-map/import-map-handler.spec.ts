import { mockExternalsHandler, mockRemoteInfoHandler } from './../../../mock/handlers.mock';
import { ExternalsHandler } from "../externals";
import { ImportMap, ImportMapHandler } from "./import-map.contract";
import { importMapHandlerFactory } from "./import-map.handler";
import { RemoteInfo, RemoteInfoHandler } from '../remote-info';

describe('importMapHandler', () => {
    let remoteInfoHandler: RemoteInfoHandler;
    let externalsHandler: ExternalsHandler;
    let importMapHandler: ImportMapHandler;

    beforeEach(() => {
        remoteInfoHandler = mockRemoteInfoHandler();

        externalsHandler = mockExternalsHandler();
        importMapHandler = importMapHandlerFactory(
            {
                builderType: "default",
                loadModuleFn: jest.fn(),
                importMapType: "importmap"
            },
            externalsHandler, 
            remoteInfoHandler
        );
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

    describe('createFromStorage', () => {
        it('should create an ImportMap from storage based on given remote', () => {
            const expected: ImportMap = {
                imports: {
                    "team/mfe1/./comp": "http://localhost:3001/comp.js",
                },
                scopes: {
                    "http://localhost:3001/": {}
                }
            };

            // REMOTES
            (remoteInfoHandler.fromStorage as jest.Mock) = jest.fn((_: string) => ({
                remoteName: "team/mfe1",
                scopeUrl: "http://localhost:3001/",
                exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
            } as RemoteInfo));

            // DEPENDENCIES
            (externalsHandler.fromStorage as jest.Mock) = jest.fn((_: string) => ({}));

            const actual = importMapHandler.fromStorage(["team/mfe1"]);

            expect(actual).toEqual(expected);
        })

        it('should add shared singleton dependencies.', () => {
            const expected: ImportMap = {
                imports: {
                    "team/mfe1/./comp": "http://localhost:3001/comp.js",
                    "rxjs": "http://localhost:3001/rxjs.js"
                },
                scopes: {
                    "http://localhost:3001/": {}
                }
            };

            // REMOTES
            (remoteInfoHandler.fromStorage as jest.Mock) = jest.fn((_: string) => ({
                remoteName: "team/mfe1",
                scopeUrl: "http://localhost:3001/",
                exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
            } as RemoteInfo));

            // DEPENDENCIES
            (externalsHandler.fromStorage as jest.Mock) = jest.fn((scope: string) => {
                if(scope === "global") return {"rxjs": {version: "7.8.1", url: "http://localhost:3001/rxjs.js"}};
                return {};
            });

            const actual = importMapHandler.fromStorage(["team/mfe1"]);

            expect(actual).toEqual(expected);
        })

        it('should add scoped dependencies.', () => {
            const expected: ImportMap = {
                imports: {
                    "team/mfe1/./comp": "http://localhost:3001/comp.js",
                },
                scopes: {
                    "http://localhost:3001/": {
                        "rxjs": "http://localhost:3001/rxjs.js"
                    }
                }
            };

            // REMOTES
            (remoteInfoHandler.fromStorage as jest.Mock) = jest.fn((_: string) => ({
                remoteName: "team/mfe1",
                scopeUrl: "http://localhost:3001/",
                exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
            } as RemoteInfo));

            // DEPENDENCIES
            (externalsHandler.fromStorage as jest.Mock) = jest.fn((scope: string) => {
                if(scope === "http://localhost:3001/") return {"rxjs": {version: "7.8.1", url: "http://localhost:3001/rxjs.js"}}
                return {};
            });

            const actual = importMapHandler.fromStorage(["team/mfe1"]);

            expect(actual).toEqual(expected);
        })

        it('should handle multiple remotes with dependencies.', () => {
            const expected: ImportMap = {
                imports: {
                    "team/mfe1/./comp": "http://localhost:3001/comp.js",
                    "team/mfe2/./comp": "http://localhost:3002/comp.js",
                    "rxjs": "http://localhost:3001/rxjs.js"
                },
                scopes: {
                    "http://localhost:3001/": { 
                        "tslib": "http://localhost:3001/tslib.js"
                    },
                    "http://localhost:3002/": {
                        "tslib": "http://localhost:3002/tslib.js"
                    }
                }
            };

            // REMOTES
            (remoteInfoHandler.fromStorage as jest.Mock) = jest.fn((remote: string) => {
                if(remote === "team/mfe1") return {
                    remoteName: "team/mfe1",
                    scopeUrl: "http://localhost:3001/",
                    exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
                }
                if(remote === "team/mfe2") return {
                    remoteName: "team/mfe2",
                    scopeUrl: "http://localhost:3002/",
                    exposes: [{moduleName: "./comp", url: "http://localhost:3002/comp.js"}]
                }
                return {}
            });

            // DEPENDENCIES
            (externalsHandler.fromStorage as jest.Mock) = jest.fn((scope: string) => {
                if(scope === "global") return {"rxjs": {version: "7.8.1", url: "http://localhost:3001/rxjs.js"}};
                if(scope === "http://localhost:3001/") return {"tslib": {version: "7.8.1", url: "http://localhost:3001/tslib.js"}}
                if(scope === "http://localhost:3002/") return {"tslib": {version: "7.8.1", url: "http://localhost:3002/tslib.js"}}

                return {};
            });

            const actual = importMapHandler.fromStorage(["team/mfe1", "team/mfe2"]);

            expect(actual).toEqual(expected);
        })
    });

    describe('addToDOM', () => {
        let originalDocument: Document;
    
        beforeEach(() => {
            originalDocument = document.cloneNode(true) as Document;
            document.head.innerHTML = '';
        });
    
        afterEach(() => {
            document.head.innerHTML = originalDocument.head.innerHTML;
        });
    
        it('should append a script element to document head', () => {
            const testMap: ImportMap = {
                imports: {
                    "rxjs@7.8.1": "http://localhost:4200/rxjs.js",
                },
                scopes: {}
            };
    
            importMapHandler.addToDOM(testMap);
    
            const scriptElement = document.head.querySelector('script');
            expect(scriptElement).not.toBeNull();
            expect(scriptElement?.type).toBe('importmap');
        });
    
        it('should set correct innerHTML with stringified import map', () => {
            const testMap: ImportMap = {
                imports: {
                    "rxjs@7.8.1": "http://localhost:4200/rxjs.js",
                    "tslib@2.8.1": "http://localhost:4200/tslib.js"  
                },
                scopes: {}
            };
    
            importMapHandler.addToDOM(testMap);
    
            const scriptElement = document.head.querySelector('script');
            const parsedContent = JSON.parse(scriptElement?.innerHTML || '{}');
            
            expect(parsedContent).toEqual(testMap);
        });
    
        it('should return the original import map', () => {
            const testMap: ImportMap = {
                imports: {
                    "rxjs@7.8.1": "http://localhost:4200/rxjs.js"
                },
                scopes: {}
            };
    
            const result = importMapHandler.addToDOM(testMap);;
            expect(result).toBe(testMap);
        });
    
        it('should handle an empty import map', () => {
            const emptyMap: ImportMap = { imports: {}, scopes: {} };
            
            importMapHandler.addToDOM(emptyMap);

            const scriptElement = document.head.querySelector('script');
            const parsedContent = JSON.parse(scriptElement?.innerHTML || '{}');
            
            expect(parsedContent).toEqual(emptyMap);
        });
    
        it('should preserve existing head content', () => {
            const existingMeta = document.createElement('meta');
            existingMeta.setAttribute('name', 'description');
            document.head.appendChild(existingMeta);
    
            const testMap: ImportMap = {
                imports: { "rxjs@7.8.1": "http://localhost:4200/rxjs.js" },
                scopes: {}
            };
    
            importMapHandler.addToDOM(testMap);
    
            expect(document.head.querySelector('meta[name="description"]')).not.toBeNull();
            expect(document.head.querySelectorAll('script').length).toBe(1);
        });
    });

});