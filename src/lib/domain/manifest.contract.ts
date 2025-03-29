import type { RemoteName } from "./remote-info.contract";

export type RemoteEntry = string;

export type Manifest = Record<RemoteName, RemoteEntry>
