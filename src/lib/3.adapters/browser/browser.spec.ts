import { createBrowser } from './browser';
import { ImportMapConfig } from 'lib/2.app/config/import-map.contract';
import { ForBrowserTasks } from 'lib/2.app/driving-ports/for-browser-tasks';

function setupDomEnvironment() {
  document.head.innerHTML = '';

  jest.spyOn(document.head, 'appendChild');
}

describe('createBrowser', () => {
  let browser: ForBrowserTasks;
  let mockConfig: ImportMapConfig;
  let mockLoadModuleFn: jest.Mock;
  let mockReplaceImportMap: jest.Mock;

  beforeEach(() => {
    setupDomEnvironment();

    mockLoadModuleFn = jest.fn().mockImplementation(_ => {
      return Promise.resolve({ default: { name: 'mocked-module' } });
    });

    mockReplaceImportMap = jest.fn((importMap: ImportMap) => {
      return Promise.resolve(importMap);
    });

    mockConfig = {
      loadModuleFn: mockLoadModuleFn,
      replaceImportMap: mockReplaceImportMap,
    };

    browser = createBrowser(mockConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  describe('setImportMap', () => {
    it('should call the setImportMap with the provided import map', async () => {
      const importMap = { imports: { 'mocked-module': 'https://example.com/mocked-module.js' } };

      await browser.setImportMap(importMap);

      expect(mockReplaceImportMap).toHaveBeenCalledWith(importMap);
    });

    it('should return the result from setImportMap', async () => {
      const importMap = { imports: { 'mocked-module': 'https://example.com/mocked-module.js' } };

      const result = await browser.setImportMap(importMap);

      expect(result).toEqual(importMap);
    });

    it('should propagate errors from setImportMap', async () => {
      const importMap = { imports: { 'mocked-module': 'https://example.com/mocked-module.js' } };
      const expectedError = new Error('Failed to set import map');

      mockReplaceImportMap.mockRejectedValueOnce(expectedError);

      await expect(browser.setImportMap(importMap)).rejects.toThrow(expectedError);
    });
  });
});
