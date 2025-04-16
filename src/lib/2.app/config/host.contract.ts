

export type HostConfig = {
    hostRemoteEntry: false|{
        url: string,
        cacheTag?: string
    }
}

export type HostOptions = Partial<HostConfig>