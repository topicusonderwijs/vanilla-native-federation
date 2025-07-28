import type { RemoteInfo, RemoteName, Remotes } from 'lib/1.domain/remote/remote-info.contract';
import type { Optional } from 'lib/utils/optional';

export type ForRemoteInfoStorage = {
  contains: (remoteName: RemoteName) => boolean;
  tryGetScope: (remoteName: RemoteName) => Optional<string>;
  tryGetModule: (remoteName: RemoteName, exposedModule: string) => Optional<string>;
  addOrUpdate: (remoteName: string, remote: RemoteInfo) => ForRemoteInfoStorage;
  getAll: () => Remotes;
  commit: () => ForRemoteInfoStorage;
};
