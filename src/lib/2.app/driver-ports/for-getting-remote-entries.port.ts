import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { Manifest } from "lib/1.domain/remote-entry/manifest.contract";

export type ForGettingRemoteEntries = (remotesOrManifestUrl: string|Manifest) => Promise<RemoteEntry[]>
