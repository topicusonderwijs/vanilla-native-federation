import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";

export type ForProvidingRemoteEntry = {
    provideHost: () => Promise<RemoteEntry|false>,
    provideRemote: (remoteEntryUrl: string) => Promise<RemoteEntry|false>,
}

