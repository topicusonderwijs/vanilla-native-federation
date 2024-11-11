# vanilla-native-federation

Check the full description of native-federation on [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation). This library is specifically made for applications that require a small library to (lazy) load micro frontends or webcomponents on HTML pages using native-federation (e.g. PHP, Ruby or Java applications) without the need for a JavaScript framework. 

This library is under [MIT License](./LICENSE.md) and is inspired on [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime).

## Usage:

Below you can find some examples of how to use the native-federation loader:

### Simple usage:

**loader.js**
```
import { initFederation } from 'vanilla-native-federation';

(() => {
    const manifest = {
        "mfe": "http://localhost:3000/remoteEntry.json"
    }
    initFederation(manifest)
        .then(({load, importMap}) => Promise.all([
            load('mfe1', './Component'),
            load('mfe2', './Component'),
        ]))
        .catch(console.error);
})();
```

### Usage using custom events: 

**loader.js**
```
import { initFederation } from 'vanilla-native-federation';

(() => {
    const manifest = {
        "mfe": "http://localhost:3000/remoteEntry.json"
    }
    initFederation(manifest)
        .then(({load, importMap}) => {
            console.log("importMap: ", importMap);
            window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
        })
})();
```

**your-shell.html**
```
    <body>
        <!-- webcomponent exposed by mfe1 remote -->
        <app-mfe-one></app-mfe-one>

        <script type="esms-options">{ "shimMode": true }</script>
        <script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

        <script type="module-shim" src="loader.js"></script>

        <script>
            window.addEventListener('mfe-loader-available', (e) => {
                Promise.all([
                    e.detail.load('mfe1', './Component'),
                    e.detail.load('mfe2', './Component'),
                ]).catch(console.error);
            }, {once: true});
        </script>  
    </body>
```

### Usage with discovery:

This library also contains the implementation for [micro frontend discovery](https://github.com/awslabs/frontend-discovery). Convenient for micro frontend architectures that require a more robust and detailed discovery mechanism: 

**loader.ts**
```
import { initFederationWithDiscovery } from 'vanilla-native-federation';

(() => {
    const myDiscoveryUrl = "http://localhost:3000";
    initFederationWithDiscovery(myDiscoveryUrl)
        .then(({load, discovery, importMap}) => {
            console.log("discovery: ", discovery);
            console.log("importMap: ", importMap);
            window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
        })
})();
```

**Expected format from discovery service:**
```
{
  "schema": "https://github.com/awslabs/frontend-discovery/blob/main/schema/v1-pre.json",
  "microFrontends": {
    "mfe1": [
      {
        "url": "http://localhost:3001/mfe1.js",
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
            "key": "./Component",
          }
        }
      }
    ],
    "mfe2": [
      {
        "url": "http://localhost:3002/mfe1.js",
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
            "key": "./Component",
          }
        }
      }
    ]
  }
}
```

**your-shell.html**
```
    <body>
        <!-- webcomponent exposed by mfe1 remote -->
        <app-mfe-one></app-mfe-one>
        <app-mfe-two></app-mfe-two>

        <script type="esms-options">{ "shimMode": true }</script>
        <script src="https://ga.jspm.io/npm:es-module-shims@1.10.1/dist/es-module-shims.js"></script>

        <script type="module-shim" src="loader.js"></script>

        <script>
            window.addEventListener('mfe-loader-available', (e) => {
                Promise.all([
                    e.detail.load('mfe1', './Component'),
                    e.detail.load('mfe2', './Component'),
                ]).catch(console.error);
            }, {once: true});
        </script>  
    </body>
```

## Building your loader.js

You can use a simple ESBuild config to build your loader into a reusable script: 

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

