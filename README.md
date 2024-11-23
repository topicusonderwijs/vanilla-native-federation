# vanilla-native-federation

Check the full description of native-federation on [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation). This library is specifically made for applications that require a small library to (lazy) load micro frontends or webcomponents on HTML pages using native-federation (e.g. PHP, Ruby or Java applications) without the need for a JavaScript framework. 

This library is under [MIT License](./LICENSE.md) and is inspired on [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime).

## More information: 

If you want to know more about Native federation, check out these sources: 

- [Talk by Manfred Steyer](https://www.youtube.com/watch?v=cofoI5_S3lE)
- [The official native federation package](https://www.npmjs.com/package/@angular-architects/native-federation)
- [Angular-architects blogpost](https://www.angulararchitects.io/blog/announcing-native-federation-1-0/)
- [Some examples](https://github.com/manfredsteyer/native-federation-core-example)


## Dependencies:

Right now the library is dependent on [es-module-shims](https://www.npmjs.com/package/es-module-shims) to resolve all dependency urls and for browser support. The shim can be added in the HTML page: 

```
<script type="esms-options">{ "shimMode": true }</script>
<script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

<script type="module-shim" src="./my-esm-module.js"></script>
```

## Usage:

Below you can find some examples of how to use the native-federation loader. The simplest implmentation is to use the initFederation function to load all remote entries. 

```
import { initFederation } from 'vanilla-native-federation';

(() => {
    const manifest = {
      "remote1": "http://localhost:3001/remoteEntry.json",
      "remote2": "http://localhost:3002/remoteEntry.json",
    }
    initFederation(manifest)
      .then(({load, importMap}) => Promise.all([
        load('remote1', './Component'),
        load('remote2', './Component'),
      ]))
      .catch(console.error);
})();
```

The `initFederation` will return the added importMap object together with a load callback, this function can load remote modules using the imported dependencies from the importMap. The loadModule returns a `Promise<any>` that represents the remote module.

## Building your loader.js

You can use a simple ESBuild config to build your loader into a reusable script, the builder will assume a directory structure like shown below: 

**File structure:**
```
/
├── src/
│   ├── index.html
│   └── loader.js
│
├── dist/
│   ├── index.html
│   └── loader.js
│
├── build.js
├── package.json
└── node_modules/
```

The builder will bundle the `loader.js` into a ESM module so that it can be imported into the HTML file. 

**build.js**
```
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

fs.rmSync('dist', { force: true, recursive: true });
fs.mkdirSync('dist', { recursive: true });
fs.copyFileSync('src/index.html', 'dist/index.html');

esbuild.build({
  entryPoints: ['src/loader.js'],
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  minify: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  target: ['es2022'],
  treeShaking: true,
  charset: 'utf8',
  metafile: true
}).then(async (result) => {
  // Log bundle size analysis
  const text = await esbuild.analyzeMetafile(result.metafile);
  console.log(text);
}).catch(() => process.exit(1));
```

## Custom events: 

Custom events can help streamline the import process, this way you can have a general initiation process and load modules on the fly. 

**loader.js**
```
import { initFederation } from 'vanilla-native-federation';

(() => {
  const manifest = {
    "remote1": "http://localhost:3001/remoteEntry.json"
  }
  initFederation(manifest)
    .then(({load, importMap}) => {
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```

Modules can be loaded by awaiting the `mfe-loader-available` event that will expose the `load` callback. 

**your-shell.html**
```
  <body>
    <!-- webcomponent exposed by remote1 -->
    <app-mfe-one></app-mfe-one>

    <script type="esms-options">{ "shimMode": true }</script>
    <script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

    <script type="module-shim" src="loader.js"></script>

    <script>
      window.addEventListener('mfe-loader-available', (e) => {
        Promise.all([
          e.detail.load('remote1', './Component'), 
          // e.detail.load({ remoteName: 'remote1', exposedModule: './Component' }),
          // e.detail.load({ remoteEntry: 'http://localhost:3002/remoteEntry.json', exposedModule: './Component' }),
        ]).catch(console.error);
      }, {once: true});
    </script>  
  </body>
```

## Using custom storage (caching): 

By default, native federation will use the window object as storage for all metadata and configuration, you can change this using a custom provided storage: 

**loader.ts**
```
import { initFederation } from 'vanilla-native-federation';
import { createSessionStorageCache } from 'vanilla-native-federation/plugins/storage';

(() => {
  const customCache = createSessionStorageCache({
    externals: {},
    remoteNamesToRemote: {},
    baseUrlToRemoteNames: {}
  })
  const manifest = {
    "remote1": "http://localhost:3001/remoteEntry.json"
  }
  initFederation(manifest, {cache: customCache})
    .then(({load, importMap}) => {
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```

## Usage with discovery:

It is possible to use a discovery service to decouple your micro frontends from the shell application. This means
that the library will attempt to fetch the available micro frontends from an external source before loading the 
remote modules: 

**loader.ts**
```
import { initFederationFromDiscovery } from 'vanilla-native-federation/plugins/discovery';

(() => {
  const myDiscoveryUrl = "http://localhost:3000";
  initFederationFromDiscovery(myDiscoveryUrl)
    .then(({load, discovery, importMap}) => {
      console.log("discovery: ", discovery);
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```

**required minimal discovery format**
```
{
  "remote1": {
    "1.0.0": {
      url: "http://localhost:3001/remote1-component.js",
      version: "1.0.0"
      module: {
        "remoteName": "remote1",
        "remoteEntry": "http://localhost:3001/remoteEntry.json",
        "exposedModule": "./Component",
      }
    }
  },
  "remote2": {
    "1.0.0": {
      url: "http://localhost:3002/remote2-component.js",
      version: "1.0.0"
      module: {
        "remoteName": "remote1",
        "remoteEntry": "http://localhost:3002/remoteEntry.json",
        "exposedModule": "./Component",
      }
    }
  }
}
```

Finally, the manifest can be utilized to load the remote Modules. 

**your-shell.html**
```
  <body>
    <!-- webcomponent exposed by remote1 -->
    <app-mfe-one></app-mfe-one>
    <app-mfe-two></app-mfe-two>

    <script type="esms-options">{ "shimMode": true }</script>
    <script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

    <script type="module-shim" src="loader.js"></script>

    <script>
      window.addEventListener('mfe-loader-available', (e) => {
        Promise.all([
          e.detail.load('remote1'), // optionally with a version: e.detail.load('remote1', '1.2.0')
          e.detail.load('remote2'),
        ]).catch(console.error);
      }, {once: true});
    </script>  
  </body>
```

### Official Micro Frontend discovery manifest:

This library also contains an implementation plugin for [micro frontend discovery](https://github.com/awslabs/frontend-discovery). Convenient for micro frontend architectures that require a more robust and detailed discovery mechanism: 

**loader.js:**
```
import { initFederationFromDiscovery, manifestMapper } from 'vanilla-native-federation/plugins/discovery';

(() => {
  const myDiscoveryUrl = "http://localhost:3000";
  initFederationFromDiscovery(
    myDiscoveryUrl,
    {discoveryMapper: manifestMapper}
  )
    .then(({load, discovery, importMap}) => {
      console.log("discovery: ", discovery);
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```

Now the library expects the official format: 

**Discovery manifest format:**

```
{
  "schema": "https://github.com/awslabs/frontend-discovery/blob/main/schema/v1-pre.json",
  "microFrontends": {
    "remote1": [
      {
        "url": "http://localhost:3001/remote1-component.js",
        "metadata": {
          "integrity": "CHECKSUM",
          "version": "1.0.0"
        },
        "deployment": {
          "traffic": 100,
          "default": true
        },
        "extras": {
          "nativefederation": {
            "remoteEntry": "http://localhost:3001/remoteEntry.json",
            "exposedModule": "./Component",
          }
        }
      }
    ],
    "remote2": [
      {
        "url": "http://localhost:3002/remote2-component.js",
        "metadata": {
          "integrity": "CHECKSUM",
          "version": "1.0.0"
        },
        "deployment": {
          "traffic": 100,
          "default": true
        },
        "extras": {
          "nativefederation": {
            "remoteEntry": "http://localhost:3002/remoteEntry.json",
            "exposedModule": "./Component",
          }
        }
      }
    ]
  }
}
```

Finally, it is also possible to provide your own custom mapper, as long as the output of the mapper at least includes the minimal discovery format defined before.

### Logging: 

For debugging, the library contains a simple logger that can give a more detailed insight in the loading process

**
loader.js**

```
import { initFederation, consoleLogger, noopLogger } from 'vanilla-native-federation';

(() => {
  initFederation("http://localhost:3000", {
    logLevel: 'debug',     // 'debug'|'warn'|'error' -> default: 'error'
    logger: consoleLogger  // default: noopLogger
  })
    .then(({load, importMap}) => {
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```

### Caching options: 

By default, the discovery plugin will return the latest versions of all available cached remotes (which is empty since caching strategy is the Window object). It is possible to switch to a more efficient caching strategy that prefers retrieving the config from the sessionStorage unless it doesn't exist: 

**loader.js:**

```
import { initFederationFromDiscovery } from 'vanilla-native-federation/plugins/discovery';
import { createSessionStorageCache } from 'vanilla-native-federation/plugins/storage';
import { cache } from 'vanilla-native-federation';

(() => {
    const customCache = {
        // default props are not cached (default) 
        ...cache.DEFAULT_CACHE,
        // Discovery is cached in sessionStorage
        ...createSessionStorageCache({
            discovery: {}
        })
    }

    const moduleVersions = {
        'remote1': '1.0.0',
        'remote2': '1.0.0'
    }
    
    initFederationFromDiscovery(
        "http://localhost:3000", 
        { cache: customCache, resolveFromCache: moduleVersions }
    ).then(({load, discovered, importMap}) => {
      console.log("discovered: ", discovered);
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```

It is possible to optimize the `moduleVersions` using the following parameter options: 

| Option                           | Description |
| -------------------------------- | ----------- |
| "skip-cache"                     | Skip the cache entirely and fetch all latest versions from remote | 
| "all-latest" (default)           | Get latest version of all cached modules |
| Record<string, string\|"latest"> | Choose which modules+version to load (from cache) |

Whenever a specific module or version doesnt exist in the cache, the loader will fetch the latest manifest from the discovery service and automatically resolves and updates all versions in cache from the new manifest. 

**Note:** The third option only loads the modules that are specified. Not specifying the loaded remotes can result in the import-map not being able to resolve certain dependencies. 
