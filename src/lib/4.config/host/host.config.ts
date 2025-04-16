import type { HostConfig, HostOptions } from "lib/2.app/config/host.contract";

export const createHostConfig = (override: Partial<HostOptions>): HostConfig => ({
    hostRemoteEntry: false,
    ...override
});