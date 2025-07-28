import { LoggingConfig } from '../init';
import { ForConvertingToImportMap } from 'lib/2.app/driver-ports/dynamic-init/for-converting-to-import-map';
import { createConvertToImportMap } from './convert-to-import-map';
import { RemoteEntry, SharedInfoActions } from 'lib/1.domain';

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

  describe('Remote Entry Exposes', () => {
    it('should add remote entry exposes to importMap', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        exposes: [
          { key: 'ComponentA', outFileName: 'component-a.js' },
          { key: 'ComponentB', outFileName: 'component-b.js' },
        ],
        shared: [],
      };
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'remote/ComponentA': 'http://my.service/mfe1/component-a.js',
          'remote/ComponentB': 'http://my.service/mfe1/component-b.js',
        },
      });
    });

    it('should handle empty exposes array', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        exposes: [],
        shared: [],
      };
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });

    it('should handle missing exposes property', async () => {
      const remoteEntry: any = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [],
      };
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });
  });

  describe('Shared Externals - singleton: false (Scoped)', () => {
    it('should add non-singleton externals to scoped imports', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
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
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://my.service/mfe1/': {
            'dep-a': 'http://my.service/mfe1/dep-a.js',
            'dep-b': 'http://my.service/mfe1/dep-b.js',
          },
        },
      });
    });

    it('should not overrides for non-singleton externals', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: false,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
        ],
        exposes: [],
      };
      const actions: SharedInfoActions = {
        'dep-a': { action: 'scope', override: 'http://scope-a.example.com/scope-a/' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://my.service/mfe1/': {
            'dep-a': 'http://my.service/mfe1/dep-a.js',
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton with "skip" action', () => {
    it('should skip externals with skip action and no shareScope', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
        ],
        exposes: [],
      };
      const actions: SharedInfoActions = {
        'dep-a': { action: 'skip' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });

    it('should handle skip action with override and shareScope', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a-xyz.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
            shareScope: 'custom-scope',
          },
        ],
        exposes: [],
      };
      const actions: SharedInfoActions = {
        'dep-a': { action: 'skip', override: 'http://my.service/mfe2/dep-a-abc.js' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://my.service/mfe1/': {
            'dep-a': 'http://my.service/mfe2/dep-a-abc.js',
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton with "scope" action', () => {
    it('should add scoped externals with scope action', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
        ],
        exposes: [],
      };
      const actions: SharedInfoActions = {
        'dep-a': { action: 'scope' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://my.service/mfe1/': {
            'dep-a': 'http://my.service/mfe1/dep-a.js',
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton shareScope with "share" action', () => {
    it('should add the shared external to the specific scope when shareScope is defined', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
            shareScope: 'custom-scope',
          },
        ],
        exposes: [],
      };
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://my.service/mfe1/': {
            'dep-a': 'http://my.service/mfe1/dep-a.js',
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton with "share" action', () => {
    it('should add globally shared externals to imports when no action specified (defaults to share)', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
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
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
        'dep-b': { action: 'share' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'dep-a': 'http://my.service/mfe1/dep-a.js',
          'dep-b': 'http://my.service/mfe1/dep-b.js',
        },
      });
    });

    it('should skip singleton externals without actions defined', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        shared: [
          {
            packageName: 'dep-a',
            outFileName: 'dep-a.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
        ],
        exposes: [],
      };
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });
  });

  describe('Combined Functionality', () => {
    it('should handle remote entry with both exposes and shared externals', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
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
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'remote/Component': 'http://my.service/mfe1/component.js',
          'remote/Service': 'http://my.service/mfe1/service.js',
          'dep-a': 'http://my.service/mfe1/dep-a.js',
        },
      });
    });

    it('should handle mixed singleton and non-singleton externals', async () => {
      const remoteEntry: RemoteEntry = {
        url: 'http://my.service/mfe1/remoteEntry.json',
        name: 'remote',
        exposes: [],
        shared: [
          {
            packageName: 'shared-global',
            outFileName: 'shared-global.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
          {
            packageName: 'scoped-dep',
            outFileName: 'scoped-dep.js',
            singleton: false,
            strictVersion: false,
            requiredVersion: '1.0.0',
          },
          {
            packageName: 'scoped-singleton',
            outFileName: 'scoped-singleton.js',
            singleton: true,
            strictVersion: true,
            requiredVersion: '1.0.0',
          },
        ],
      };
      const actions: SharedInfoActions = {
        'shared-global': { action: 'share' },
        'scoped-singleton': { action: 'scope' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'shared-global': 'http://my.service/mfe1/shared-global.js',
        },
        scopes: {
          'http://my.service/mfe1/': {
            'scoped-dep': 'http://my.service/mfe1/scoped-dep.js',
            'scoped-singleton': 'http://my.service/mfe1/scoped-singleton.js',
          },
        },
      });
    });
  });
});
