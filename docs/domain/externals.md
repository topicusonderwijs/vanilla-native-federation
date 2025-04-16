
# Externals

The externals are shared dependencies over the initialized remotes. They are used as source to build up the ImportMap. 

## Aggregate

```mermaid
classDiagram
    SharedExternals *-- SharedExternal
    SharedExternal *-- SharedVersion
    ScopedExternals *-- ExternalsScope
    ExternalsScope *-- Version

    class SharedExternals {
        Map<`string, SharedExternal>
    }
    class SharedExternal {
        dirty: boolean
        versions: SharedVersion[]
    }
    class SharedVersion{
        version: string
        url: string
        requiredVersion: string
        strictVersion: boolean
        cached: boolean
        host: boolean
        action: 'skip'|'scope'|'share'
    }  
    class ScopedExternals {
        Map<`string, ExternalsScope[]>
    } 
    class ExternalsScope {
        Map<`string, Version>
    } 
    class Version{
        version: string
        url: string
    }

```

## Structure

```json
{
    "shared-externals": {
        "depA": [
            {
                "version":"1.1.2", 
                "url":"http://url.to/example/depA.js",
                "requiredVersion": "~1.1.0", 
                "strictVersion": true, 
                "action": "share",
                "host": true,
                "cached": true
            },
            {
                "version":"1.0.1", 
                "url":"http://another.to/example/depA.js",
                "requiredVersion": "~1.0.0", 
                "strictVersion": true, 
                "action": "skip",
                "host": false,
                "cached": true
            }
        ]
    },
    "scoped-externals": {
        "http://custom.url/scope": {
            "depB": {
                "version":"2.0.1", 
                "url":"http://another.url/scope/depB.js"
            }
        }
    }
}
```