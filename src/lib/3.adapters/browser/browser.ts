import type { ForBrowserTasks } from 'lib/2.app/driving-ports/for-browser-tasks';
import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';

const createBrowser = (config: ImportMapConfig): ForBrowserTasks => {
  return {
    setImportMapFn: config.setImportMapFn,
    importModule: config.loadModuleFn,
  };
};

export { createBrowser };
