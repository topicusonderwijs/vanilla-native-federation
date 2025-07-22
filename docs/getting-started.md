[< back](./../README.md)

# Getting Started

This guide demonstrates how to integrate the vanilla-native-federation orchestrator into your application. The orchestrator is used to integrate micro frontends into any HTML page. As expected, the orchestrator uses the [native-federation mental model](https://www.npmjs.com/package/@angular-architects/native-federation) to share dependencies over the micro frontends and load ES modules.

## Prerequisites

This library is part of the bigger native-federation pattern and covers the integration of micro frontends in the shell (host) application. Therefore, this getting-started tutorial assumes:

- Basic HTML and JavaScript knowledge.
- The presence of one or more micro frontends with published `remoteEntry.json` files.

## Quick Integration

The simplest approach uses the pre-built runtime script with declarative configuration. This method requires no build tools or npm installation - everything is configured directly in HTML.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Application</title>

    <!-- Enable shim-mode for optimal browser support -->
    <script type="esms-options">
      { "shimMode": true }
    </script>

    <!-- Define your micro frontends -->
    <script type="application/json" id="mfe-manifest">
      {
        "team/button": "http://localhost:3000/remoteEntry.json",
        "team/header": "http://localhost:4000/remoteEntry.json"
      }
    </script>

    <!-- Handle loaded modules -->
    <script>
      window.addEventListener(
        'mfe-loader-available',
        e => {
          // Load your micro frontends
          e.detail.loadRemoteModule('team/button', './Button');
          e.detail.loadRemoteModule('team/header', './Header');
        },
        { once: true }
      );
    </script>

    <!-- Include the runtime -->
    <script src="https://unpkg.com/vanilla-native-federation@0.15.0/quickstart.mjs"></script>
  </head>
  <body>
    <!-- Use your loaded components -->
    <my-header></my-header>
    <my-button>Click me</my-button>
  </body>
</html>
```

### Understanding the HTML Structure

The quick integration relies on three essential HTML components that work together to bootstrap the micro frontend system:

**Manifest Declaration**<br />
The manifest script tag tells the system where to find your micro frontends. The `id="mfe-manifest"` attribute is required because the quickstart runtime specifically searches for this element when initializing. Without this exact ID, the runtime cannot discover your micro frontends.

```html
<script type="application/json" id="mfe-manifest">
  {
    "team/button": "http://localhost:3000/remoteEntry.json",
    "team/header": "http://localhost:4000/remoteEntry.json"
  }
</script>
```

Each entry maps a logical name (like "@team/component") to the URL of that micro frontend's metadata file. The runtime fetches these URLs to understand what components are available and what dependencies they need.

**Event Handler Setup**<br />
The micro frontend loading process is asynchronous - the runtime needs time to fetch metadata, resolve dependencies, and set up import maps. The `mfe-loader-available` event signals when this process is complete and the `loadRemoteModule` function is ready to use.

```html
<script>
  window.addEventListener(
    'mfe-loader-available',
    event => {
      const { loadRemoteModule } = event.detail;

      loadRemoteModule('team/button', './Button');
      loadRemoteModule('team/header', './Header');
    },
    { once: true }
  );
</script>
```

The `{ once: true }` option ensures the event handler only runs once, preventing duplicate loading if the event somehow fires multiple times. Each `loadRemoteModule` call fetches and initializes a specific micro frontend. This function typically triggers side effects like registering custom elements rather than returning component instances directly.

**Runtime Inclusion**
The runtime script performs all the orchestration work: fetching manifests, processing metadata, resolving dependencies, and setting up the browser's module loading system.

```html
<script src="https://unpkg.com/vanilla-native-federation@latest/quickstart.mjs"></script>
```

This script must be loaded after the manifest and event handler are defined, as it immediately begins looking for the manifest and will fire the `mfe-loader-available` event once initialization completes.

### Component Rendering

```html
<body>
    <my-header></my-header>
    <my-button>Click me</my-button>
</body>
</html>
```

Micro frontends can register themselves as custom elements (part of the [webcomponents](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) spec). When you call `loadRemoteModule("team/button", "./Button")`, the loaded component typically registers a custom element like `<my-button>`. The HTML elements in your page will remain empty until the corresponding micro frontends load and register themselves.

### Quickstart (pre-built)

```html
<!-- Development and quick testing -->
<script src="https://unpkg.com/vanilla-native-federation@0.15.0/quickstart.mjs"></script>
```

## Custom Implementation

For applications requiring specific configuration or integration patterns, a custom implementation provides complete control over the initialization process. This approach is necessary when you need to integrate with existing build systems, customize the loading behavior, or handle errors in application-specific ways.

### Why Custom Implementation?

The quickstart approach works well for simple scenarios, but custom implementation becomes necessary when:

- **Build Integration**: You need to bundle the orchestrator with your application code
- **Fine-grained control**: Your application requires specific error handling, a specific optimized orchestrator or custom fallback behavior.
- **Framework Integration**: You're integrating with React, Angular, Vue, or other frameworks that manage component lifecycles
- **Advanced Caching**: You need fine-grained control over storage and caching strategies

### Implementation Process

Custom implementation involves three key steps: installing dependencies, creating an orchestrator script, and integrating with your HTML.

### Installation

```bash
npm install vanilla-native-federation es-module-shims
```

The [es-module-shims](https://www.npmjs.com/package/es-module-shims) package provides polyfill support for older browsers that don't natively support import maps. Even if you're targeting modern browsers, including this dependency ensures broader compatibility.

> I also found out that you can't create the import map and import the module defined in the import-map in the same "script". _that is, within the same script tag_. The es-module-shims polyfill however, does! This is also the reason why the orchestrator is in a different script and the loadRemoteModule is shared through an custom event that is fired after the import-map is added to the HTML.

### Creating the Orchestrator

```javascript
import 'es-module-shims';
import { initFederation } from 'vanilla-native-federation';
import {
  consoleLogger,
  sessionStorageEntry,
  useShimImportMap,
} from 'vanilla-native-federation/options';

(async () => {
  const manifest = {
    'team/button': 'http://localhost:3000/remoteEntry.json',
    'team/header': 'http://localhost:4000/remoteEntry.json',
  };

  try {
    const { loadRemoteModule } = await initFederation(manifest, {
      logLevel: 'error',
      logger: consoleLogger,
      storage: sessionStorageEntry,
      ...useShimImportMap({ shimMode: true }),
    });

    // Load specific modules (only possible in shim-mode)
    await Promise.all([
      loadRemoteModule('team/button', './Button'),
      loadRemoteModule('team/header', './Header'),
    ]);

    console.log('All micro frontends loaded successfully');
  } catch (error) {
    console.error('Failed to initialize micro frontends:', error);
    // Handle initialization failure appropriately for your application
  }
})();
```

This approach gives you explicit control over the initialization timing, error handling, and configuration. The `try-catch` block allows you to implement fallback behavior if micro frontend loading fails.

### Integration Strategy

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Application</title>
    <!-- Include es-module-shims for older browser compatibility -->
    <script type="esms-options">
      { "shimMode": true }
    </script>
    <script
      async
      src="https://ga.jspm.io/npm:es-module-shims@2.6.0/dist/es-module-shims.js"
    ></script>
  </head>
  <body>
    <!-- Your micro frontend components will render here -->
    <my-header></my-header>
    <my-button>Click me</my-button>

    <!-- Load your orchestrator script -->
    <script type="module-shim" src="./orchestrator.js"></script>
  </body>
</html>
```

The `type="module"` attribute is essential because the orchestrator uses ES module syntax (`import` statements). This tells the browser to treat the script as an ES module, enabling the use of modern JavaScript features and the native federation library. `type="module-shim"` provides fallback for legacy browsers for maximum compatibility.

> More info about shim-mode [here](https://github.com/guybedford/es-module-shims?tab=readme-ov-file#shim-mode).

## Configuration Options

The library provides extensive configuration options to control behavior, storage, logging, and dependency resolution. Understanding these options is crucial for production deployments and complex integration scenarios. For complete details, see the [Configuration Guide](./config.md).

### Storage Configuration

Storage configuration determines how the library caches micro frontend metadata and resolved dependencies between page loads. The choice significantly impacts performance and user experience.

```javascript
import { initFederation } from 'vanilla-native-federation';
import {
  globalThisStorageEntry,
  sessionStorageEntry,
  localStorageEntry,
} from 'vanilla-native-federation/options';

await initFederation(manifest, {
  // Memory only - fastest, lost on page reload (default)
  storage: globalThisStorageEntry,

  // Session storage - persists across page reloads within the same browser session
  storage: sessionStorageEntry,

  // Local storage - persists across browser sessions
  storage: localStorageEntry,

  // Clear existing cache on initialization
  clearStorage: true,

  // Choose a custom namespace for where the remoteEntries are stored.
  storageNamespace: '__NATIVE_FEDERATION__',
});
```

**Why Storage Matters**: Server-side applications often involve multiple page loads as users navigate. Keeping track of which dependencies were already are cached by the browser (even on previously visited pages) may prevent the download of redundant scripts.

For example. if a mfe on page A uses the same dependency as a mfe on page B. It would be a waste to redownload that dependency if the previously version could be reused!

**Memory vs Session vs Local Storage**:

- Memory storage is fastest but lost on every page reload
- Session storage persists during the browser session, ideal for multi-page (SSR) websites
- Local storage persists across browser restarts, useful for cache that needs to exist over longer periods and multiple browser sessions

### Import Map Implementation

Import map configuration determines how the browser loads JavaScript modules. This choice affects browser compatibility and loading performance.

```javascript
await initFederation(manifest, {
  // Use native browser import maps (default)
  importMapType: 'importmap',
  loadModuleFn: url => import(url),

  // Use es-module-shims polyfill for older browsers
  ...useShimImportMap({ shimMode: true }),
});
```

**Why Import Map Configuration Matters**: Import maps are a relatively new browser feature. Older browsers don't support them natively, so you need a polyfill. The es-module-shims library provides this polyfill, but it adds overhead. If you're only supporting modern browsers, the default configuration is fastest. If you need broader compatibility, use the shim mode.

### Logging Configuration

Logging helps diagnose issues during development and can provide insights into loading performance in production.

```javascript
await initFederation(manifest, {
  // Log level: "debug", "warn", or "error"
  logLevel: 'debug',

  // Built-in loggers
  logger: consoleLogger, // Logs to browser console
  logger: noopLogger, // No logging

  // Custom logger
  logger: {
    debug: (msg, details) => console.log(`[DEBUG] ${msg}`, details),
    warn: (msg, details) => console.warn(`[WARN] ${msg}`, details),
    error: (msg, details) => console.error(`[ERROR] ${msg}`, details),
  },
});
```

**Fine-grained control**: During development, debug-level logging shows you exactly what micro frontends are being loaded, what dependencies are being shared, and how version conflicts are resolved. In production, you typically want error-level logging only to avoid console noise while still capturing critical issues.

### Mode Configuration

Mode configuration controls how the library handles dependency conflicts and optimization strategies.

```javascript
await initFederation(manifest, {
  // Fail on version conflicts (default: false)
  strict: true,

  // Resolution profile
  profile: defaultProfile, // Optimize for compatibility
  profile: cachingProfile, // Optimize for performance

  // Custom profile
  profile: {
    latestSharedExternal: true, // Always use latest dependency versions
    skipCachedRemotes: 'always', // Skip re-fetching known micro frontends
  },
});
```

**Optimize your orchestrator**: Different applications can have different tolerance for risk. A strict mode setup fails fast when dependency versions are incompatible, The errors will still be runtime so be aware! The caching profile optimizes for performance by skipping already downloaded micro frontends. This can be useful but will cause the orchestrator to miss recently deployed versions of the remotes since it only takes from cache.

### Host Remote Entry

Host remote entry configuration allows you to control over which versions of shared dependencies are used globally. The dependency versions of the hostRemoteEntry have a higher precedence than the versions defined in the remote remoteEntries. The cacheTag allows the orchestrator to treat the hostRemoteEntry as a different file, thus redownloading a new version if the cacheTag changed.

```javascript
await initFederation(manifest, {
  // host remoteEntry configuration with (optional) cache busting
  hostRemoteEntry: {
    url: './host-remoteEntry.json',
    cacheTag: 'v1.2.3',
  },
});
```

**Why Host Configuration Matters**: Without a host configuration, the library automatically chooses dependency versions based on compatibility algorithms. With a host configuration, you can explicitly control critical dependencies like React or Angular versions. This is essential when you need to ensure all micro frontends use the same version of a core library, regardless of what individual teams specify in their configurations.

## Bundling the Orchestrator

For production deployments, it is recommended to bundle the orchestrator script. This creates a single JavaScript file which can be imported into the shell application. The example below shows a simple ESBuild configuration for bundling.

```javascript
// build.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/orchestrator.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/orchestrator.min.js',
  minify: true,
  platform: 'browser',
  target: 'es2022',
});
```

## Loading Remote Modules

The `loadRemoteModule` function exposed by `initFederation`, accepts a remote name and exposed module path and returns a Promise:

```javascript

const { as, loadRemoteModule, remote, config } = await initFederation(manifest, {/* options */ });

// Basic usage - loads module for side effects (e.g., custom element registration)
await loadRemoteModule('team/button', './Button');

// If the module exports something directly, you can access it
const buttonModule = await loadRemoteModule('team/button', './Button');

// Type-safe usage with TypeScript
const typedComponent = await as<ButtonComponent>().loadTypedModule('team/button', './Button');

// Remote-specific loader
const buttonRemote = remote<ButtonComponent>('team/button');
const button = await buttonRemote.loadModule('./Button');

// Reading the configuration
console.log(config); // type: ConfigContract
```

### The ConfigContract

The initFederation takes the `options` explained above as input and merges them with the default 'fallback' options into a `config` object. This object is used as general "environment" object that decides how the orchestrator should behave. The config object can be used after initialization to interact with internals of the library like cache or the logger.

## Framework Integration

This library integrates with any frontend framework or backend technology with minimal interference. It only needs plain HTML and support for JavaScript. The orchestrator seamlessly integrates with the current native-federation ecosystem and can also be used as replacement for the default `@softarc/native-federation-runtime` library.

### Angular host

The orchestrator can also be used in Angular applications by updating the `main.ts`:

```javascript
import { initFederation } from 'vanilla-native-federation';
import { useShimImportMap } from 'vanilla-native-federation/options';

initFederation(
  {},
  {
    hostRemoteEntry: './remoteEntry.json',
    ...useShimImportMap({ shimMode: true }),
  }
)
  .then(async nf => {
    const app = await import('./bootstrap');
    await app.bootstrap(nf.loadRemoteModule);
  })
  .catch(err => {
    console.error('Failed to load app!');
    console.error(err);
  });
```

And then the `bootstrap.ts` to allow the use of the `loadRemoteModule`.

```javascript
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig, InjectionToken, provideZoneChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { LoadRemoteModule } from 'vanilla-native-federation';

const appConfig = (loader: LoadRemoteModule<unknown>): ApplicationConfig => ({
  providers: [
    { provide: MODULE_LOADER, useValue: loader },
    provideZoneChangeDetection({eventCoalescing: true})
  ]
});

export const bootstrap = (loader: LoadRemoteModule<unknown>) =>
  bootstrapApplication(AppComponent, appConfig(loader))
    .catch((err) => console.error(err));
```

## Examples

If you want to see how the orchestrator can be used check out these repositories! Want to add yours? create a PR or issue:

| techniques              | repo                                                         |
| ----------------------- | ------------------------------------------------------------ |
| Angular                 | https://github.com/Aukevanoost/native-federation-examples-ng |
| Angular + Java (wicket) | https://github.com/Aukevanoost/native-federation-examples    |

## Next Steps

For comprehensive configuration options and advanced features, see the [Configuration Guide](./config.md), which covers:

- **Host Configuration**: Control critical dependency versions
- **Storage Options**: Choose persistence strategies for different use cases
- **Import Map Implementations**: Browser compatibility and polyfill options
- **Logging Configuration**: Debug and monitor micro frontend loading
- **Mode Configuration**: Tune dependency resolution and error handling

For deeper understanding of the system:

- Check [Architecture Documentation](./architecture.md) for an overview of the concepts.
- Dive into [Version Resolution](./version-resolver.md) to learn about dependency management.
