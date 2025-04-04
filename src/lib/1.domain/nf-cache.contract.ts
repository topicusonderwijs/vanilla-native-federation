import type { Externals } from "./externals.contract";
import type { RemoteInfo } from "./remote-info.contract";

export type NfCache = {
    externals:  Record<string, Record<string, Externals>>;
    remotes: Record<string, RemoteInfo>; 
};
