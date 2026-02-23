import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';
import { replaceInDOM } from './replace-in-dom';

declare function importShim<T>(url: string): T;

const useShimImportMap = (cfg: { shimMode: boolean } = { shimMode: false }): ImportMapConfig => ({
  loadModuleFn: url => importShim(url),
  setImportMapFn: replaceInDOM(cfg.shimMode ? 'importmap-shim' : 'importmap'),
  reloadBrowserFn: () => {
    window.location.reload();
  },
});

export { useShimImportMap };
