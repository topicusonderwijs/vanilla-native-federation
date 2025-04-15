import type { HostConfig } from "lib/2.app/config/host.contract";

export const createHostConfig = (override: Partial<HostConfig>): HostConfig => ({
    hostRemoteEntry: false,
    ...override
});