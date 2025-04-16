
# RemoteEntry.json

The RemoteEntry.json is a remote's metadata file. It is fetched by the native-federation adapter and processed to be stored in cache. 

## Aggregates

```mermaid
classDiagram
    RemoteEntry *-- ExposesInfo
    RemoteEntry *-- SharedInfo

    class RemoteEntry {
        name: string
        url: string
        exposes: ExposesInfo[]
        shared: SharedInfo[]
        host: boolean|undefined
    }
    class ExposesInfo{
        key: string
        outFileName: string
    }
    class SharedInfo{
        singleton: boolean
        strictVersion: boolean
        requiredVersion: string
        version?: string
        packageName: string
        outFileName: string
    }
```