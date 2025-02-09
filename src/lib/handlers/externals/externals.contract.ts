import type {SharedInfo, ShareObject, ShareConfig, ShareOptions} from '@softarc/native-federation-runtime';

import type { Remote } from "./../remote-info/remote-info.contract"

type ExternalsHandler = {
    toScope(scopeUrl: string): string,
    getFromScope(scope: string|'global'): Record<string, {version:string, url: string}>;
    addToStorage(remoteInfo: Remote): Remote
}

// const defaultShareOptions: ShareOptions = {
//     singleton: false,
//     requiredVersionPrefix: '',
// };

// https://github.com/angular-architects/module-federation-plugin/blob/main/libs/native-federation-runtime/src/lib/get-shared.ts#L34

export { ExternalsHandler, SharedInfo, ShareObject, ShareConfig, ShareOptions }
