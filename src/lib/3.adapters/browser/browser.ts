import type { ForBrowserTasks } from 'lib/2.app/driving-ports/for-browser-tasks';
import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';
import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';

const createBrowser = (config: ImportMapConfig): ForBrowserTasks => {
  return {
    setImportMap: function (importMap: ImportMap) {
      document.head
        .querySelectorAll(`script[type="${config.importMapType}"]`)
        .forEach(importMap => importMap.remove());

      document.head.appendChild(
        Object.assign(document.createElement('script'), {
          type: config.importMapType,
          innerHTML: JSON.stringify(importMap),
        })
      );
      return importMap;
    },
    importModule: function (moduleUrl: string) {
      return config.loadModuleFn(moduleUrl);
    },
  };
};

export { createBrowser };
