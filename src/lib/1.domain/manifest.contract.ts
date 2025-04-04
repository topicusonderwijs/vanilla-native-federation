import type { RemoteName } from "./remote-info.contract";

export type RemoteEntryUrl = string;

export type Manifest = Record<RemoteName, RemoteEntryUrl>
