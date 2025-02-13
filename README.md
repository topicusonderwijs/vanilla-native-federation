# vanilla-native-federation

Check the full description of native-federation on [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation). This library is specifically made for applications that require a small library to (lazy) load micro frontends or webcomponents on HTML pages using native-federation (e.g. PHP, Ruby or Java applications) without the need for a JavaScript framework. 

This library is under [MIT License](./LICENSE.md) and is inspired on [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime). If you want to know more about Native federation, check out these sources: 

- [Talk by Manfred Steyer](https://www.youtube.com/watch?v=cofoI5_S3lE)
- [The official native federation package](https://www.npmjs.com/package/@angular-architects/native-federation)
- [Angular-architects blogpost](https://www.angulararchitects.io/blog/announcing-native-federation-1-0/)
- [Some examples](https://github.com/manfredsteyer/native-federation-core-example)

## Table of Contents

1. Dependencies
2. Usage
3. Bundling your loader.js
4. Examples
    1. Communication through 'custom events'
    2. Custom Logging
    3. Generic loader.js
5. Plugins
    1. Custom storage (caching)

## 1 &nbsp; Dependencies:

Right now the library is dependent on [es-module-shims](https://www.npmjs.com/package/es-module-shims) to resolve all dependency urls and for browser support. The shim can be added in the HTML page: 

```
<script type="esms-options">{ "shimMode": true }</script>
<script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

<script type="module-shim" src="./my-esm-module.js"></script>
```

**Important:** The examples assume that the fetched remote modules bootstrap a [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements). The `load()` method in this vanilla-native-federation library returns a promise of the contents of the remote JavaScript module returned. It is also possible to write a different (custom) handler for the returned module. 

## 2 &nbsp; Usage:

Below you can find some examples of how to use the native-federation loader. The simplest implmentation is to use the initFederation function to load all remote entries. Where `team-mfe1` is your custom micro frontend ESM. 

```
<html>
    <head>
        <title>Shell</title>
    </head>
    <body>
        <team-mfe1></team-mfe1>

        <script type="esms-options">{ "shimMode": true }</script> 
        <script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>
            
        <script type="module-shim">
            import {initFederation} from 'https://esm.run/vanilla-native-federation';

            console.log("test");
            initFederation({
                "team-mfe1": "http://localhost:3001/remoteEntry.json",
            }).then(({load}) => load("team-mfe1", "./comp"));
        </script>
    </body>
</html>
```

However, the recommended way is to create your own customized variant of the orchestrator. This allows you to override certain steps or append plugins like custom loggers. This example will make use of ESBuild:

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

The `initFederation` will return the importMap object that was appended to the HTML page together with a `load()` callback, this function can load remote modules using the imported dependencies from the importMap. The `load()` callback returns a `Promise<unknown>` that represents the remote module that was retrieved.

Below are the types of the exposed functions: 

```
type InitFederation = (
    remotesOrManifestUrl: string | Record<string, string> = {},
    override: Partial<Config> & {steps?: Partial<StepFactories>} = {}
) => Promise<{load: LoadRemoteModule, importMap: ImportMap}>


type LoadRemoteModule = (remoteName: string, exposedModule: string) => Promise<unknown>
```


## 3 &nbsp; Bundling your loader.js

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
  platform: "browser",
  format: "esm",
  resolveExtensions: [".js", ".mjs"],
  splitting: false,
  minify: true,        
  sourcemap: false,      
  metafile: true,        
  target: ['es2022'],    
  treeShaking: true,
}).then(async (result) => {
  const text = await esbuild.analyzeMetafile(result.metafile);
  console.log(text);
}).catch(() => process.exit(1));
```

## 4 &nbsp; Examples

Below are some examples of how to use the library in different scenario's.

### 4.1 &nbsp; Communication through 'custom events': 
<hr>

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
        ]).catch(console.error);
      }, {once: true});
    </script>  
  </body>
```

### 4.2 &nbsp; Custom logging: 

For debugging, the library contains a simple logger that can give a more detailed insight in the loading process

**loader.js**

```
import { initFederation, noopLogger } from 'vanilla-native-federation';
import { consoleLogger } from 'vanilla-native-federation/plugins/logging';

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

### 4.3 &nbsp; Generic loader.js: 
<hr>

It is possible to make the loader.js even more generic. This allows you to reduce the amount of config you have to provide to the loader.js.

**loader.js**
```
import { initFederation } from 'vanilla-native-federation';

const initMicroFrontends = (urlOrManifest, remotes) => {
  return initFederation(urlOrManifest)
    .then(({load, importMap}) => Promise.all(
      remotes.map(r => load(r, "./Component"))
    ))
}

export { initMicroFrontends };
```

Remotes can now be defined in the new method and the loading is abstracted away by the loader.js file. 

**your-shell.html**
```
  <body>
    <app-mfe-one></app-mfe-one>
    <app-mfe-two></app-mfe-two>

    <script type="esms-options">{ "shimMode": true }</script>
    <script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

    <script type="module-shim">
      import { initMicroFrontends } from "./loader.js";

      (async () => {
        await initMicroFrontends(
          "http://localhost:3000", 
          ["remote1", "remote2"]
        )
      })()
    </script> 
  </body>
```


## 5 &nbsp; Plugins

There are a few plugins baked into the library to customize the initialization even further. 

## 5.2 &nbsp; Custom storage (caching): 

By default, native federation will use the window object as storage for all metadata and configuration, you can change this using a custom provided storage types like sessionStorage and localStorage: 

**loader.ts**
```
import { initFederation } from 'vanilla-native-federation';
import { sessionStorageEntry } from 'vanilla-native-federation/plugins/storage';

(() => {
  const manifest = {
    "remote1": "http://localhost:3001/remoteEntry.json"
  }
  initFederation(manifest, {storageType: sessionStorageEntry})
    .then(({load, importMap}) => {
      console.log("importMap: ", importMap);
      window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    })
})();
```