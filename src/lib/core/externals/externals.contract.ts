import type {SharedInfo, ShareObject, ShareConfig, ShareOptions} from '@softarc/native-federation-runtime';

import type { Version } from '../version/version.contract';

type ExternalsHandler = {
    fromStorage(scope: string|'global'): Record<string, Version>;
    toStorage(externals: SharedInfo[], scopeUrl: string): SharedInfo[];
    checkForIncompatibleSingletons(externals: SharedInfo[]): void;
}

export { ExternalsHandler, SharedInfo, ShareObject, ShareConfig, ShareOptions }
