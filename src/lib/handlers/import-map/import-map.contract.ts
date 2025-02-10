import type { ImportMap } from '@softarc/native-federation-runtime';

import type { RemoteName } from '../remote-info';

type ImportMapHandler = {
    create: (from?: ImportMap) => ImportMap,
    fromStorage: (manifest: RemoteName[]) => ImportMap,
    addToDOM: (map: ImportMap) => ImportMap
}

export { Imports, Scopes } from '@softarc/native-federation-runtime';
export { ImportMapHandler, ImportMap}
