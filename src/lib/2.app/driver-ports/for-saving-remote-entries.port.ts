import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";

export type ForSavingRemoteEntries = (remoteEntries: RemoteEntry[]) => Promise<void>
