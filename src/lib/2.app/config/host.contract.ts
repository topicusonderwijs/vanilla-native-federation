export type HostConfig = {
  hostRemoteEntry:
    | false
    | {
        name: string;
        url: string;
        cacheTag?: string;
      };
};

export type HostOptions = {
  hostRemoteEntry?:
    | string
    | false
    | {
        name?: string;
        url: string;
        cacheTag?: string;
      };
};
