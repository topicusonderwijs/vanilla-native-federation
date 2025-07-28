import type { SharedExternal, shareScope, SharedVersion } from 'lib/1.domain';
import type { Optional } from 'lib/utils/optional';

export type ForSharedExternalsStorage = {
  tryGetVersions: (external: string, shareScope?: string) => Optional<SharedVersion[]>;
  getAll: (shareScope?: string) => shareScope;
  getScopes: (o?: { includeGlobal: boolean }) => string[];
  scopeType: (shareScope?: string) => 'global' | 'strict' | 'shareScope';
  addOrUpdate: (
    name: string,
    external: SharedExternal,
    shareScope?: string
  ) => ForSharedExternalsStorage;
  markVersionAsUsedBy: (
    externalName: string,
    versionIDX: number,
    remoteName: string,
    shareScope?: string
  ) => boolean;
  commit: () => ForSharedExternalsStorage;
};
