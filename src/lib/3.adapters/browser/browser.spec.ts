import { createBrowser } from './browser';
import { ImportMapConfig } from '../../2.app/config/import-map.contract';
import { ForBrowserTasks } from '../../2.app/driving-ports/for-browser-tasks';
import { MOCK_IMPORT_MAP } from '../../6.mocks/domain/import-map.mock';

/**
 * Setup JSDOM environment for tests
 */
function setupDomEnvironment() {
    // Clear any existing import map scripts
    document.head.innerHTML = '';

    // Add a spy to track appendChild calls
    jest.spyOn(document.head, 'appendChild');
}

describe('createBrowser', () => {
    let browser: ForBrowserTasks;
    let mockConfig: ImportMapConfig;
    let mockLoadModuleFn: jest.Mock;

    beforeEach(() => {
        // Setup test environment
        setupDomEnvironment();

        // Setup mock for loadModuleFn
        mockLoadModuleFn = jest.fn().mockImplementation((_) => {
            return Promise.resolve({ default: { name: 'mocked-module' } });
        });

        // Setup mock config
        mockConfig = {
            importMapType: 'importmap',
            loadModuleFn: mockLoadModuleFn
        };

        // Create browser instance
        browser = createBrowser(mockConfig);
    });

    afterEach(() => {
        // Clean up spies
        jest.restoreAllMocks();
    });

    describe('setImportMap', () => {

        it('should create a new script element with correct type', () => {
            const importMap = MOCK_IMPORT_MAP();
            browser.setImportMap(importMap);

            const script = document.head.querySelector('script[type="importmap"]');
            expect(script).not.toBeNull();
            expect(document.head.appendChild).toHaveBeenCalled();
        });

        it('should remove existing import map scripts', () => {
            const existingScript = document.createElement('script');
            existingScript.type = 'importmap';
            existingScript.innerHTML = JSON.stringify({ imports: { 'test': 'test.js' } });
            document.head.appendChild(existingScript);

            expect(document.head.querySelectorAll('script[type="importmap"]').length).toBe(1);

            const importMap = MOCK_IMPORT_MAP();
            browser.setImportMap(importMap);

            const scripts = document.head.querySelectorAll('script[type="importmap"]');
            expect(scripts.length).toBe(1);
            expect(scripts[0]!.innerHTML).toBe(JSON.stringify(importMap));
        });

        it('should set the innerHTML to stringified import map', () => {
            const importMap = MOCK_IMPORT_MAP();
            browser.setImportMap(importMap);

            const script = document.head.querySelector('script[type="importmap"]');
            expect(script!.innerHTML).toBe(JSON.stringify(importMap));
        });

        it('should return the import map', () => {
            const importMap = MOCK_IMPORT_MAP();
            const result = browser.setImportMap(importMap);

            expect(result).toEqual(importMap);
        });

        it('should use custom import map type from config', () => {
            mockConfig.importMapType = 'custom-importmap';
            browser = createBrowser(mockConfig);

            const importMap = MOCK_IMPORT_MAP();
            browser.setImportMap(importMap);

            expect(document.head.querySelector('script[type="custom-importmap"]')).not.toBeNull();
            expect(document.head.querySelector('script[type="importmap"]')).toBeNull();
        });

        it('should replace existing import map even with multiple scripts', () => {
          for (let i = 0; i < 3; i++) {
            const existingScript = document.createElement('script');
            existingScript.type = 'importmap';
            existingScript.innerHTML = JSON.stringify({ imports: { [`test${i}`]: `test${i}.js` } });
            document.head.appendChild(existingScript);
          }

          expect(document.head.querySelectorAll('script[type="importmap"]').length).toBe(3);

          const importMap = MOCK_IMPORT_MAP();
          browser.setImportMap(importMap);

          const scripts = document.head.querySelectorAll('script[type="importmap"]');
          expect(scripts.length).toBe(1);
          expect(scripts[0]!.innerHTML).toBe(JSON.stringify(importMap));
        });
    });

    describe('importModule', () => {
        it('should call the loadModuleFn with the provided URL', async () => {
            const moduleUrl = 'https://example.com/module.js';

            await browser.importModule(moduleUrl);

            expect(mockLoadModuleFn).toHaveBeenCalledWith(moduleUrl);
        });

        it('should return the result from loadModuleFn', async () => {
            const moduleUrl = 'https://example.com/module.js';
            const expectedModule = { default: { name: 'mocked-module' } };

            const result = await browser.importModule(moduleUrl);

            expect(result).toEqual(expectedModule);
        });

        it('should propagate errors from loadModuleFn', async () => {
            const moduleUrl = 'https://example.com/error-module.js';
            const expectedError = new Error('Failed to load module');

            mockLoadModuleFn.mockRejectedValueOnce(expectedError);

            await expect(browser.importModule(moduleUrl)).rejects.toThrow(expectedError);
        });
    });
});