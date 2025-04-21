[< back](./../README.md)

# Built in version resolver

Whenever an external (dependency) is marked as singleton, the intended behavior is for native-federation to share that external over multiple remotes when possible. Therefore, the version resolver will calculate the best version to share based on a couple of parameters: 

The `vanilla-native-federation` library is made specifically for SSR hosts, that is, hosts that are not specifically an SPA. Therefore, every page change will result in a full page refresh. The custom storage options and version resolver mitigate the extra downloads as much as possible by caching the previously downloaded dependencies, potentially saving resources thus optimizing performance. 

## The limitations of an importmap

Browser-native importmaps have the limitation that only one version of each external can be globally shared at the same time. Luckily, externals can also be [scoped by the url of their caller](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap#scopes). An example of an importmap can be found below: 

```
{
    imports: {
        "dep-a": "http://my.service/mfe1/dep-a.js" // version 1.1.9
    },
    scopes: {
        "http://my.service/mfe2/": {
            "dep-a": "http://my.service/mfe2/dep-a.js" // version 0.1.9
        }
    }
}
```

Therefore, native-federation requires a resolver to calculate which versions to share, which versions to skip (if compatible with the shared version) and which version to scope (if incompatible with the shared version).

## Merging versions into storage

Step 1 (get-remote-entries) will skip the download of a remoteEntry.json if the remote is already in storage. This can save redundant downloads of files that have already been processed. This can be bypassed by adding the `clearCache: true` flag to the [configuration](./config.md). __note:__ this only counts when persistance storage like `sessionStorage` or `localStorage` is chosen as storage type. 

Step 2 (process-remote-entries) will merge the externals from the remoteEntry.json into the existing storage. For `singleton: false` externals that means the pre-existing scope is deleted from storage and the scoped dependencies are inserted into memory. For `singleton: true` externals the version will be inserted in a central list of versions connected to that specific external. If the version already exists in that list the insertion will be skipped. This builds up a list of available versions per shared external.

## Determining which version to use in the importmap

An importmap can only globally share 1 version of a specific external. Therefore, step 3 (determine-shared-externals) will determine the action of the different versions defined in the external. The precedence is as follows: 

### 1) Host versions

If a version came from a host remoteEntry.json (defined in the [configuration](./config.md)), it will be used as globally shared version of that external. This allows for a fine-grained control of which version is used as shared version. 

### 2) Prioritize latest version

When this flag is added to the [configuration](./config.md), the resolver will choose the latest available version as globally shared version.

### 3) Choose most optimal version

If a version was already used in an importmap prior to this initialization, it will be flagged in storage as `cached: true` since it has already been downloaded before. If a specific version is chosen, all incompatible other versions of that external will be added to their own scope resulting in extra downloads to accomodate for the remotes that require the incompatible versions. 

Based on the abovementioned parameters, the resolver will calculate which version causes the least extra downloads. This version will be chosen as the shared version. 

## Persisting the changes

When the import map is generated at step 4 (generate-import-map), the versions that are included into the importmap are marked as `cached: true`. 

At step 5 (commit-changes), all changes and calculations are persisted to the storage to be used as basis for the next initialization. 