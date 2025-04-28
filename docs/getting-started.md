[< back](./../README.md)

# Getting started

A preconfigured setup of the `vanilla-native-federation` can be used in a HTML file to experiment with the notion of native federation. The orchestrator can be added to the host as follows:

```
<html>
    <head>
        <title>Shell</title>
        <script type="application/json" id="mfe-manifest">
            {
                "team/mfe1": "http://localhost:3000/remoteEntry.json",
            }
        </script>
        <script>
            <!-- event will be fired if native-federation initialization is done -->
            window.addEventListener('mfe-loader-available', (e) => {
                e.detail.loadRemoteModule("team/mfe1", "<your-exposed-comp>");
            }, {once: true});
        </script>
        <script src="https://unpkg.com/vanilla-native-federation@0.12.2/quickstart/debug.mjs"></script>
    </head>
    <body>
        <!-- Name of your custom element -->
        <team-mfe1></team-mfe1>
    </body>
</html>
```

The quickstart will look for a script in the HTML file with the id "manifest". Based on this script, it will initialize the defined `Remotes`. Right now there are 2 quickstart builds:

```html
<!-- logLevel: debug -->
<script src="https://unpkg.com/vanilla-native-federation@0.12.0/quickstart/debug.mjs"></script>

<!-- logLevel: error -->
<script src="https://unpkg.com/vanilla-native-federation@0.12.0/quickstart/test.mjs"></script>
````

## Dependencies:

Right now, it is recommended to use the [es-module-shims](https://www.npmjs.com/package/es-module-shims) library to provide fallback functionality for old browsers regarding import maps. The shim can be added in the HTML page: 

```
<script async src="https://ga.jspm.io/npm:es-module-shims@2.0.9/dist/es-module-shims.js"></script>
```

**Important:** The examples assume that the fetched remote modules bootstrap a [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements). The `loadRemoteModule()` method in this vanilla-native-federation library returns a promise of the contents of the remote JavaScript module returned. Therefore, it is also possible to write a different (custom) handler for the returned ES module. 

## Implementing a custom orchestrator

The `vanilla-native-federation` library acts as an orchestrator for micro frontends in a host application that might not be a JavaScript/SPA application. The quickstart builds help a SSR application like PHP, Java Sevlets, Ruby or ASP.NET to implement native-federation with minimal configuration. For some projects it might be necessary to implement a more customized variant of the orchestrator. This is possible by building and hosting a custom implemnetation of the `vanilla-native-federation` library.

A custom implementation `orchestrator.js` can be created as followed:

```js
import 'es-module-shims';

import { initFederation, config } from 'vanilla-native-federation';

(async () => {
    const manifest = {
        "remote1": "http://localhost:3001/remoteEntry.json",
        "remote2": "http://localhost:3002/remoteEntry.json",
    }

    await initFederation(manifest, {
        logLevel: "error", 
        logger: config.consoleLogger, 
        ...config.useShimImportMap({shimMode: true})
    }).then(({loadRemoteModule}) => 
        Promise.all([
            loadRemoteModule('team/mfe1', './comp'),
            loadRemoteModule('team/mfe2', './comp'),
        ])
    );
})();
```

> More info about the configuration options can be found [here](./config.md).

The `initFederation` will return a `loadRemoteModule(<remote>, <exposed-comp>)` callback, this function can load remote modules using the imported dependencies from the importMap. The `loadRemoteModule` callback returns a `Promise<unknown>` that represents the remote module that was retrieved. The function cannot be used before initialization, hence it is provided after the init Promise is resolved. It is however entirely possible to link this callback to the global Window object.

## Bundling your orchestrator.js

You can use a simple ESBuild config to bundle your loader into a reusable script, the builder will assume a directory structure like shown below: 

**File structure:**
```
/
├── src/
│   ├── index.html
│   └── orchestrator.js
│
├── dist/
│   ├── index.html
│   └── orchestrator.js
│
├── build.js
├── package.json
└── node_modules/
```

The builder will bundle the `orchestrator.js` into a ESM module so that it can be imported into the HTML file. 

**package.json**
A package manager like `npm` is required to setup the custom orchestrator. The commands below can be used to install the necessary dependencies. 

```
$ npm init
$ npm install esbuild --save-dev
$ npm install es-module-shims
$ npm install vanilla-native-federation
```

**build.js**
```
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TS_CONFIG = {
  bundle: true,
  platform: "browser",
  format: "esm",
  mainFields: ["es2022", "browser", "module", "main"],
  conditions: ["es2022", "es2015", "module"],
  resolveExtensions: [".js", ".mjs"],
  splitting: false,
  logLevel: "info",
  minify: false,        
  sourcemap: true,      
  metafile: true,        
  target: ['es2022'],    
  treeShaking: true,
}

async function copyFile(src, dist, file) {
  const srcPath = path.join(src, file);
  const distPath = path.join(dist, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`Copied ${file} to dist folder`);
  } else {
    console.warn(`Warning: ${srcPath} not found`);
  }
}

async function buildAdapter(src, dist) {
  return await esbuild.build({
    ...TS_CONFIG,
    entryPoints: [path.join(src, "orchestrator.js")],
    outdir: dist,
  });
}

async function build() {
  try {
    const dist = path.join(__dirname, "dist");
    const src = path.join(__dirname, "src");

    const staticFiles = [
        "index.html"
    ]
    await Promise.all(staticFiles.map(f => copyFile(src, dist, f)))

    const result = await buildAdapter(src, dist);

    const text = await esbuild.analyzeMetafile(result.metafile);
    console.log('\nBuild Analytics:\n' + text);

    console.log('\nBuild completed successfully! 🎉');
    console.log(`Output directory: ${dist}`);

  } catch (error) {
    console.error("\nBuild failed:", error);
    process.exit(1);
  } finally {
    await esbuild.stop();
  }
}

process.on('SIGINT', async () => {
  console.log('\nBuild interrupted');
  await esbuild.stop();
  process.exit(0);
});

build();
```

