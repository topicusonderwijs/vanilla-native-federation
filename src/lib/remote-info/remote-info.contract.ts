import type { SharedConfig } from "../dependency/shared-config";

export type RemoteEntry = {
    name: string;
    shared: SharedConfig[];
    exposes: {
        key: string;
        outFileName: string;
    }[];
}

export type RemoteInfo = RemoteEntry & { baseUrl: string; }