import type { HostConfig, HostOptions } from "lib/2.app/config/host.contract";

export const createHostConfig = (override: Partial<HostOptions>): HostConfig => {   

    if(typeof override.hostRemoteEntry === "string") {
        return {
            hostRemoteEntry: {
                name: "__NF-HOST__",
                url: override.hostRemoteEntry
            }
        }
    }

    if(!!override.hostRemoteEntry?.url) {
        return {
            hostRemoteEntry: {
                name: "__NF-HOST__",
                ...override.hostRemoteEntry,
            }
        }
    }

    return { hostRemoteEntry: false }
};