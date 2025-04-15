import { createBrowser } from './browser';
import { createMockImportMapHandler } from '../../6.mocks/handlers/import-map.handler';
import { ImportMapHandler } from '../../2.app/handlers/import-map.contract';

describe('createBrowser', () => {
    let mockImportMapHandler: ImportMapHandler;
    let mockImportMapElement: any;
    let mockScriptElement: any;
    
    beforeEach(() => {
        jest.clearAllMocks();

        mockImportMapHandler = createMockImportMapHandler();
        mockImportMapElement = { remove: jest.fn() };
        mockScriptElement = {};
        
        document.head.querySelectorAll = jest.fn().mockReturnValue([mockImportMapElement]);   
        document.createElement = jest.fn().mockReturnValue(mockScriptElement);
        document.head.appendChild = jest.fn().mockReturnValue(mockScriptElement);
    });
        
    describe('setImportMap', () => {
        it('should remove existing import map scripts from the document head', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = { imports: { 'module-a': './path/to/module-a.js' } };
            
            browser.setImportMap(importMap);
            
            expect(document.head.querySelectorAll).toHaveBeenCalledWith(`script[type="importmap"]`);
            expect(mockImportMapElement.remove).toHaveBeenCalled();
        });
        
        it('should create a new script element with correct type and content', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = { imports: { 'module-a': './path/to/module-a.js' } };
            
            browser.setImportMap(importMap);
            
            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(mockScriptElement).toEqual({
                type: "importmap",
                innerHTML: JSON.stringify(importMap)
            });
        });
        
        it('should append the new script element to document head', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = { imports: { 'module-a': './path/to/module-a.js' } };
            
            browser.setImportMap(importMap);
            
            expect(document.head.appendChild).toHaveBeenCalledWith(mockScriptElement);
        });
        
        it('should return the import map', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = { imports: { 'module-a': './path/to/module-a.js' } };
            
            const result = browser.setImportMap(importMap);
            
            expect(result).toBe(importMap);
        });
        
        it('should handle multiple import map entries', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = {
                imports: {
                    'module-a': './path/to/module-a.js',
                    'module-b': './path/to/module-b.js',
                    'module-c': './path/to/module-c.js'
                }
            };
            
            browser.setImportMap(importMap);
            expect(mockScriptElement).toEqual({
                type: "importmap",
                innerHTML: JSON.stringify(importMap)
            });
        });

        it('should handle multiple scopes and imports', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = {
                imports: {
                    'module-a': './path/to/module-a.js',
                    'module-b': './path/to/module-b.js',
                    'module-c': './path/to/module-c.js'
                },
                scopes: {
                    "/scope-a": {
                        'module-c': './path/to/module-c.js',
                        'module-d': './path/to/module-d.js'
                    },
                    "/scope-b": {
                        'module-e': './path/to/module-e.js'
                    },
                    "/scope-c": { }
                }
            };
            
            browser.setImportMap(importMap);
            expect(mockScriptElement).toEqual({
                type: "importmap",
                innerHTML: JSON.stringify(importMap)
            });
        });
        
        
        it('should handle empty import map', () => {
            const browser = createBrowser({
                importMap: mockImportMapHandler
            });
            const importMap = { imports: {} };
            
            browser.setImportMap(importMap);
            
            expect(mockScriptElement).toEqual({
                type: "importmap",
                innerHTML: JSON.stringify(importMap)
            });
        });
    });
});