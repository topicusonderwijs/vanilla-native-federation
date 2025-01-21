import { appendImportMapToDOM } from './dom';
import type { ImportMap } from "../handlers/import-map/import-map.contract";

describe('appendImportMapToDOM', () => {
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

        appendImportMapToDOM(testMap);

        const scriptElement = document.head.querySelector('script');
        expect(scriptElement).not.toBeNull();
        expect(scriptElement?.type).toBe('importmap-shim');
    });

    it('should set correct innerHTML with stringified import map', () => {
        const testMap: ImportMap = {
            imports: {
                "rxjs@7.8.1": "http://localhost:4200/rxjs.js",
                "tslib@2.8.1": "http://localhost:4200/tslib.js"  
            },
            scopes: {}
        };

        appendImportMapToDOM(testMap);

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

        const result = appendImportMapToDOM(testMap);
        expect(result).toBe(testMap);
    });

    it('should handle an empty import map', () => {
        const emptyMap: ImportMap = { imports: {}, scopes: {} };
        
        appendImportMapToDOM(emptyMap);
        
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

        appendImportMapToDOM(testMap);

        expect(document.head.querySelector('meta[name="description"]')).not.toBeNull();
        expect(document.head.querySelectorAll('script').length).toBe(1);
    });
});