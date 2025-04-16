
# RemoteInfo

The RemoteInfo is the object that defines the remote combined with its exposed modules. 

## Aggregates

```mermaid
classDiagram
    Remotes *-- RemoteInfo
    RemoteInfo *-- RemoteModule

    class Remotes {
        Map<`string, RemoteInfo>
    } 
    
    class RemoteInfo {
        scopeUrl: string
        exposes: RemoteModule[] 
    }
    
    class RemoteModule{
        moduleName: string
        url: string
    }

```