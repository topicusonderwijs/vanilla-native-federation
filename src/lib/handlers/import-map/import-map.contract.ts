import type { ImportMap } from '@softarc/native-federation-runtime';

import type { Remote } from '../remote-info/remote-info.contract';


type ImportMapHandler = {
    // toImportMap: (remoteInfo: Remote, remoteName?: string) => ImportMap,
    create: (from?: ImportMap) => ImportMap,
    createFromStorage: (remotes: Remote[]) => ImportMap
}

export { Imports, Scopes } from '@softarc/native-federation-runtime';
export { ImportMapHandler, ImportMap}
