
# Externals

The externals are shared dependencies over the initialized remotes. They are used as source to build up the ImportMap. 

## Aggregate

```mermaid
classDiagram
    Externals *-- Version
    Version <|-- SharedVersion

    class Externals {
        global: Record<`string, SharedVersion[]>,
        scoped: Record<`string, Record<'string, Version>>
    }
    class Version{
        version: string
        url: string
    }
    class SharedVersion{
        requiredVersion: string
        strictVersion: boolean
        action: 'skip'|'scope'|'share'
    }   
a

```

## Structure

```json
{
    "shared": {
        "depA": [
            {
                "version":"1.1.2", 
                "url":"http://url.to/example/depA.js",
                "requiredVersion": "~1.1.0", 
                "strictVersion": true, 
                "action": "share"
            },
            {
                "version":"1.0.1", 
                "url":"http://another.to/example/depA.js",
                "requiredVersion": "~1.0.0", 
                "strictVersion": true, 
                "action": "skip"
            }
        ]
    },
    "scoped": {
        "http://custom.url/scope": {
            "depB": {
                "version":"2.0.1", 
                "url":"http://another.url/scope/depB.js"
            }
        }
    }
}
```