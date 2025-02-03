import type { ImportMap } from '@softarc/native-federation-runtime';

import type { Remote } from '../remote-info/remote-info.contract';


type ImportMapHandler = {
    // toImportMap: (remoteInfo: Remote, remoteName?: string) => ImportMap,
    createEmpty: () => ImportMap,
    toImportMap: (remotes: Remote[]) => ImportMap
}

export { Imports } from '@softarc/native-federation-runtime';
export { ImportMapHandler, ImportMap}
