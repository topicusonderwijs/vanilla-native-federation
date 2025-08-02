import type { HostConfig, HostOptions } from 'lib/2.app/config/host.contract';

export const createHostConfig = (override: Partial<HostOptions>): HostConfig => {
  if (!override?.hostRemoteEntry) {
    return { hostRemoteEntry: false };
  }
  if (typeof override.hostRemoteEntry === 'string') {
    return {
      hostRemoteEntry: {
        name: '__NF-HOST__',
        url: override.hostRemoteEntry,
      },
    };
  }
  return {
    hostRemoteEntry: {
      name: '__NF-HOST__',
      ...override.hostRemoteEntry,
    },
  };
};
