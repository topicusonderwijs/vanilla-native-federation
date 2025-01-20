import { ImportMap } from '@softarc/native-federation-runtime';
import { domHandlerFactory } from './dom.handler';
import { DomHandler } from './dom.contract';

describe('domHandlerFactory', () => {
    let documentHead: HTMLHeadElement;
    let mockAppendChild: jest.Mock;
    
    beforeEach(() => {
        mockAppendChild = jest.fn();
        documentHead = {
            appendChild: mockAppendChild
        } as unknown as HTMLHeadElement;
        
        Object.defineProperty(document, 'head', {
            value: documentHead,
            writable: true
        });
        
        document.createElement = jest.fn().mockReturnValue({});
    });
    
    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should create a DomHandler instance', () => {
        const handler = domHandlerFactory();
        expect(handler).toBeDefined();
        expect(handler.appendImportMap).toBeInstanceOf(Function);
    });

    describe('appendImportMap', () => {
        let handler: DomHandler;
        
        beforeEach(() => {
            handler = domHandlerFactory();
        });

        test('should append script element with correct attributes', () => {
            const importMap: ImportMap = {
                imports: {
                    'module-a': './path/to/module-a.js',
                    'module-b': './path/to/module-b.js'
                },
                scopes: {}
            };

            handler.appendImportMap(importMap);

            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(mockAppendChild).toHaveBeenCalled();

            const appendedElement = mockAppendChild.mock.calls[0][0];
            expect(appendedElement.type).toBe('importmap-shim');
            expect(appendedElement.innerHTML).toBe(JSON.stringify(importMap));
        });

        test('should handle empty import map', () => {
            const emptyMap = { imports: {}, scopes: {} };

            handler.appendImportMap(emptyMap);

            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(mockAppendChild).toHaveBeenCalled();

            const appendedElement = mockAppendChild.mock.calls[0][0];
            expect(appendedElement.innerHTML).toBe(JSON.stringify(emptyMap));
        });

        test('should return the provided import map', () => {
            const importMap = {
                imports: {
                    'module-a': './path/to/module-a.js'
                },
                scopes: {}
            };

            const result = handler.appendImportMap(importMap);

            expect(result).toBe(importMap);
        });

        test('should handle complex import maps', () => {
            const complexMap = {
                imports: {
                    'module-a': './path/to/module-a.js',
                    'module-b': './path/to/module-b.js'
                },
                scopes: {
                    '/scope1/': {
                        'module-c': './path/to/module-c.js'
                    }
                }
            };

            handler.appendImportMap(complexMap);

            const appendedElement = mockAppendChild.mock.calls[0][0];
            expect(appendedElement.innerHTML).toBe(JSON.stringify(complexMap));
        });
    });
});