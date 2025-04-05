import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";

export type ForProvidingRemoteEntry = {
    provide: (remoteEntryUrl: string) => Promise<RemoteEntry>
}

