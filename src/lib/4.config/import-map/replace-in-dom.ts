import type { ImportMap } from 'lib/1.domain';
import type { SetImportMap } from 'lib/2.app/config/import-map.contract';

export const replaceInDOM =
  (mapType: string): SetImportMap =>
  (importMap: ImportMap, opts = {}) => {
    if (opts?.override) {
      document.head
        .querySelectorAll(`script[type="${mapType}"]`)
        .forEach(importMap => importMap.remove());
    }

    document.head.appendChild(
      Object.assign(document.createElement('script'), {
        type: mapType,
        innerHTML: JSON.stringify(importMap),
      })
    );
    return Promise.resolve(importMap);
  };
