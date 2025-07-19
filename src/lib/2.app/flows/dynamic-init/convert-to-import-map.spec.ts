import { LoggingConfig } from '../init';
import { ForConvertingToImportMap } from 'lib/2.app/driver-ports/dynamic-init/for-converting-to-import-map';
import { createConvertToImportMap } from './convert-to-import-map';
import { RemoteEntry } from 'lib/1.domain';

describe('createConvertToImportMap', () => {
  let convertToImportMap: ForConvertingToImportMap;
  let mockConfig: LoggingConfig;

  beforeEach(() => {
    mockConfig = {
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        level: 'debug',
      },
    } as LoggingConfig;

    convertToImportMap = createConvertToImportMap(mockConfig);
  });

  describe('addRemoteInfos', () => {
    it('should add remote entry exposes to importMap', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        exposes: [
          { key: 'Component', outFileName: 'component.js' },
          { key: 'Service', outFileName: 'service.js' },
        ],
        shared: [],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {
          'remote/Component': 'http://example.com/component.js',
          'remote/Service': 'http://example.com/service.js',
        },
      });
    });
    it('should handle empty exposes object', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        exposes: [],
        shared: [],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {},
      });
    });
  });

  describe('addExternals', () => {
    it('should add globally shared externals to importMap', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
          {
            packageName: 'dep-b',
            outFileName: 'dep-b.js',
            singleton: true,
            strictVersion: false,
            requiredVersion: '1.0.0',
          },
        ],
        exposes: [],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {
          'dep-a': 'http://example.com/dep-a.js',
          'dep-b': 'http://example.com/dep-b.js',
        },
      });
    });

    it('should add scoped externals to importMap', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: false,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
          {
            packageName: 'dep-b',
            outFileName: 'dep-b.js',
            singleton: false,
            strictVersion: false,
            requiredVersion: '1.0.0',
          },
        ],
        exposes: [],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://example.com/': {
            'dep-a': 'http://example.com/dep-a.js',
            'dep-b': 'http://example.com/dep-b.js',
          },
        },
      });
    });

    it('should handle scope overrides', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: false,
            strictVersion: true,
            requiredVersion: '1.0.0',
            scopeOverride: 'http://scope-a.example.com/scope-a/',
          },
          {
            packageName: 'dep-b',
            outFileName: 'dep-b.js',
            singleton: false,
            strictVersion: false,
            requiredVersion: '1.0.0',
            scopeOverride: 'http://scope-b.example.com/scope-b/',
          },
        ],
        exposes: [],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://example.com/': {
            'dep-a': 'http://scope-a.example.com/scope-a/dep-a.js',
            'dep-b': 'http://scope-b.example.com/scope-b/dep-b.js',
          },
        },
      });
    });

    it('should handle empty shared array', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        shared: [],
        exposes: [],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {},
      });
    });

    it('should handle missing shared property', async () => {
      const remoteEntry: any = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        exposes: [],
      };
      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({ imports: {} });
    });

    it('should handle combined remote entry with scoped and shared', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        exposes: [],
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
          {
            packageName: 'dep-b',
            outFileName: 'dep-b.js',
            singleton: false,
            strictVersion: false,
            requiredVersion: '1.0.0',
          },
        ],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {
          'dep-a': 'http://example.com/dep-a.js',
        },
        scopes: {
          'http://example.com/': {
            'dep-b': 'http://example.com/dep-b.js',
          },
        },
      });
    });
  });

  describe('combined functionality', () => {
    it('should handle remote entry with both exposes and shared externals', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://example.com/remoteEntry.json',
        name: 'remote',
        exposes: [
          { key: 'Component', outFileName: 'component.js' },
          { key: 'Service', outFileName: 'service.js' },
        ],
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
        ],
      };

      const importMap = await convertToImportMap(remoteEntry);
      expect(importMap).toEqual({
        imports: {
          'remote/Component': 'http://example.com/component.js',
          'remote/Service': 'http://example.com/service.js',
          'dep-a': 'http://example.com/dep-a.js',
        },
      });
    });
  });
});
