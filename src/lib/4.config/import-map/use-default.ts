import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';
import { replaceInDOM } from './replace-in-dom';

const useDefaultImportMap = (): ImportMapConfig => ({
  loadModuleFn: url => import(/* @vite-ignore */ url),
  setImportMapFn: replaceInDOM('importmap'),
  reloadBrowserFn: () => {
    window.location.reload();
  },
});

export { useDefaultImportMap };
