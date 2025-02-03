import type {SharedInfo, ShareObject, ShareConfig, ShareOptions} from '@softarc/native-federation-runtime';

import type { Remote } from "./../remote-info/remote-info.contract"

type SharedInfoHandler = {
    mapSharedDeps: (remoteInfo: Remote) => Record<string, string>,
    addToCache: (remoteInfo: Remote) => Remote
}

// const defaultShareOptions: ShareOptions = {
//     singleton: false,
//     requiredVersionPrefix: '',
// };

// https://github.com/angular-architects/module-federation-plugin/blob/main/libs/native-federation-runtime/src/lib/get-shared.ts#L34

export { SharedInfoHandler, SharedInfo, ShareObject, ShareConfig, ShareOptions }
