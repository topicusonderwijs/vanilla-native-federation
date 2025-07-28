import type { RemoteName, ScopedExternals, Version } from 'lib/1.domain';

export type ForScopedExternalsStorage = {
  addExternal: (
    remoteName: RemoteName,
    external: string,
    version: Version
  ) => ForScopedExternalsStorage;
  getAll: () => ScopedExternals;
  commit: () => ForScopedExternalsStorage;
};
