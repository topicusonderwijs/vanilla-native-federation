import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";

export type ForProvidingRemoteEntries = {
    provideHost: () => Promise<RemoteEntry|false>,
    provideRemote: (remoteEntryUrl: string) => Promise<RemoteEntry|false>,
}

