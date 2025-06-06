[< back](./../README.md)

# Getting Started

This guide demonstrates how to integrate the vanilla-native-federation orchestrator into your application to be able to load micro frontends. As expected, the orchestrator uses the native-federation mental model.

## Prerequisites

This library is part of the bigger native-federation pattern and covers the integration of micro frontends in the host/shell application. Therefore, this getting-started tutorial assumes: 

- Basic HTML and JavaScript knowledge
- One or more micro frontends with published `remoteEntry.json` files

## Quick Integration

The simplest approach uses the pre-built runtime script with declarative configuration. This method requires no build tools or npm installation - everything is configured directly in HTML.

```html
<!DOCTYPE html>
<html>
    <head>
        <title>My Application</title>
        
        <!-- Define your micro frontends -->
        <script type="application/json" id="mfe-manifest">
            {
                "team/button": "http://localhost:3000/remoteEntry.json",
                "team/header": "http://localhost:4000/remoteEntry.json"
            }
        </script>
        
        <!-- Handle loaded modules -->
        <script>
            window.addEventListener('mfe-loader-available', (e) => {
                // Load your micro frontends
                e.detail.loadRemoteModule("team/button", "./Button");
                e.detail.loadRemoteModule("team/header", "./Header");
            }, {once: true});
        </script>
        
        <!-- Include the runtime -->
        <script src="https://unpkg.com/vanilla-native-federation@0.12.6/quickstart/debug.mjs"></script>
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

Each entry maps a logical name (like "team/button") to the URL of that micro frontend's metadata file. The runtime fetches these URLs to understand what components are available and what dependencies they need.

**Event Handler Setup**<br />
The micro frontend loading process is asynchronous - the runtime needs time to fetch metadata, resolve dependencies, and set up import maps. The `mfe-loader-available` event signals when this process is complete and the `loadRemoteModule` function is ready to use.

```html
<script>
    window.addEventListener('mfe-loader-available', (event) => {
        const { loadRemoteModule } = event.detail;
        
        loadRemoteModule("team/button", "./Button");
        loadRemoteModule("team/header", "./Header");
    }, { once: true });
</script>
```

The `{ once: true }` option ensures the event handler only runs once, preventing duplicate loading if the event somehow fires multiple times. Each `loadRemoteModule` call fetches and initializes a specific component from a micro frontend. This function typically triggers side effects like registering custom elements rather than returning component instances directly.

**Runtime Inclusion**
The runtime script performs all the orchestration work: fetching manifests, processing metadata, resolving dependencies, and setting up the browser's module loading system.

```html
<script src="https://unpkg.com/vanilla-native-federation@latest/quickstart/debug.mjs"></script>
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

Most micro frontends built for server-side integration register themselves as custom elements (web components). When you call `loadRemoteModule("team/button", "./Button")`, the loaded component typically registers a custom element like `<my-button>`. The HTML elements in your page will remain empty until the corresponding micro frontends load and register themselves.

### Runtime Variants

```html
<!-- Development build with detailed logging -->
<script src="https://unpkg.com/vanilla-native-federation@0.12.6/quickstart/debug.mjs"></script>

<!-- Production build with minimal logging -->
<script src="https://unpkg.com/vanilla-native-federation@0.12.6/quickstart/test.mjs"></script>
```

## Custom Implementation

For applications requiring specific configuration or integration patterns, a custom implementation provides complete control over the initialization process. This approach is necessary when you need to integrate with existing build systems, customize the loading behavior, or handle errors in application-specific ways.

### Why Custom Implementation?

The quickstart approach works well for simple scenarios, but custom implementation becomes necessary when:

- **Build Integration**: You need to bundle the orchestrator with your application code
- **Error Handling**: Your application requires specific error handling or fallback behavior
- **Dynamic Configuration**: Micro frontend locations need to be determined at runtime
- **Framework Integration**: You're integrating with React, Angular, Vue, or other frameworks that manage component lifecycles
- **Advanced Caching**: You need fine-grained control over storage and caching strategies

### Implementation Process

Custom implementation involves three key steps: installing dependencies, creating an orchestrator script, and integrating with your HTML.

### Installation

```bash
npm install vanilla-native-federation es-module-shims
```

The `es-module-shims` package provides polyfill support for older browsers that don't natively support import maps. Even if you're targeting modern browsers, including this dependency ensures broader compatibility.

### Creating the Orchestrator

```javascript
import 'es-module-shims';
import { initFederation, config } from 'vanilla-native-federation';

async function initializeMicroFrontends() {
    const manifest = {
        "team/button": "http://localhost:3000/remoteEntry.json",
        "team/header": "http://localhost:4000/remoteEntry.json"
    };

    try {
        const { loadRemoteModule } = await initFederation(manifest, {
            logLevel: "error",
            logger: config.consoleLogger,
            storage: config.sessionStorageEntry,
            ...config.useShimImportMap({ shimMode: true })
        });

        // Load specific modules
        await Promise.all([
            loadRemoteModule('team/button', './Button'),
            loadRemoteModule('team/header', './Header')
        ]);
        
        console.log('All micro frontends loaded successfully');
    } catch (error) {
        console.error('Failed to initialize micro frontends:', error);
        // Handle initialization failure appropriately for your application
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeMicroFrontends);
```

This approach gives you explicit control over the initialization timing, error handling, and configuration. The `try-catch` block allows you to implement fallback behavior if micro frontend loading fails, which is crucial for production applications.

### Integration Strategy

```html
<!DOCTYPE html>
<html>
<head>
    <title>Application</title>
    <!-- Include es-module-shims for older browser compatibility -->
    <script type="esms-options">{ "shimMode": true }</script> 
    <script async src="https://ga.jspm.io/npm:es-module-shims@2.5.1/dist/es-module-shims.js"></script>
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
import { initFederation, config } from 'vanilla-native-federation';

await initFederation(manifest, {
    // Memory only - fastest, lost on page reload (default)
    storage: config.globalThisStorageEntry,
    
    // Session storage - persists across page reloads within the same browser session
    storage: config.sessionStorageEntry,
    
    // Local storage - persists across browser sessions
    storage: config.localStorageEntry,
    
    // Clear existing cache on initialization
    clearStorage: true,

    // Choose a custom namespace for where the remoteEntries are stored. 
    storageNamespace: "__NATIVE_FEDERATION__"
});
```

**Why Storage Matters**: Server-side applications often involve multiple page loads as users navigate. Without storage, each page load would re-fetch all micro frontend metadata and re-resolve dependencies, creating unnecessary network requests and slower page loads. Session storage provides a good balance - micro frontends stay cached during a user's session but don't persist indefinitely.

**Memory vs Session vs Local Storage**: 
- Memory storage is fastest but lost on every page reload
- Session storage persists during the browser session, ideal for multi-page websites
- Local storage persists across browser restarts, useful for cache that needs to exist over longer periods and multiple browser sessions

### Import Map Implementation

Import map configuration determines how the browser loads JavaScript modules. This choice affects browser compatibility and loading performance.

```javascript
await initFederation(manifest, {
    // Use native browser import maps (default)
    importMapType: "importmap",
    loadModuleFn: url => import(url),
    
    // Use es-module-shims polyfill for older browsers
    ...config.useShimImportMap({ shimMode: true }),
});
```

**Why Import Map Configuration Matters**: Import maps are a relatively new browser feature. Older browsers don't support them natively, so you need a polyfill. The es-module-shims library provides this polyfill, but it adds overhead. If you're only supporting modern browsers, the default configuration is fastest. If you need broader compatibility, use the shim mode.

### Logging Configuration

Logging helps diagnose issues during development and can provide insights into loading performance in production.

```javascript
await initFederation(manifest, {
    // Log level: "debug", "warn", or "error"
    logLevel: "debug",
    
    // Built-in loggers
    logger: config.consoleLogger,  // Logs to browser console
    logger: config.noopLogger,     // Silent operation
    
    // Custom logger
    logger: {
        debug: (msg, details) => console.log(`[DEBUG] ${msg}`, details),
        warn: (msg, details) => console.warn(`[WARN] ${msg}`, details),
        error: (msg, details) => console.error(`[ERROR] ${msg}`, details)
    }
});
```

**Why Logging Configuration Matters**: During development, debug-level logging shows you exactly what micro frontends are being loaded, what dependencies are being shared, and how version conflicts are resolved. In production, you typically want error-level logging only to avoid console noise while still capturing critical issues.

### Mode Configuration

Mode configuration controls how the library handles dependency conflicts and optimization strategies.

```javascript
await initFederation(manifest, {
    // Fail on version conflicts (default: false)
    strict: true,
    
    // Resolution profile
    profile: config.defaultProfile,    // Optimize for compatibility
    profile: config.cachingProfile,    // Optimize for performance
    
    // Custom profile
    profile: {
        latestSharedExternal: true,    // Always use latest dependency versions
        skipCachedRemotes: true        // Skip re-fetching known micro frontends
    }
});
```

**Why Mode Configuration Matters**: Different applications have different tolerance for risk. A strict mode setup fails fast when dependency versions are incompatible, preventing runtime errors but potentially making the application less resilient. The caching profile optimizes for performance by skipping known micro frontends, but might miss updates. The default profile balances compatibility and performance.

### Host Remote Entry

Host remote entry configuration allows you to control which versions of shared dependencies get used globally.

```javascript
await initFederation(manifest, {
    // Simple host configuration
    hostRemoteEntry: {
        url: "./host-remoteEntry.json"
    },
    
    // Advanced host configuration with cache busting
    hostRemoteEntry: {
        url: "./host-remoteEntry.json",
        cacheTag: "v1.2.3"
    }
});
```

**Why Host Configuration Matters**: Without a host configuration, the library automatically chooses dependency versions based on compatibility algorithms. With a host configuration, you can explicitly control critical dependencies like React or Angular versions. This is essential when you need to ensure all micro frontends use the same version of a core library, regardless of what individual teams specify in their configurations.

## Build Configuration

For production deployments, bundle the orchestrator script. This creates a single JavaScript file which can be imported into the shell application. The example below shows a simple ESBuild configuration for bundling. 

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
    target: 'es2022'
});
```

## Loading Remote Modules

The `loadRemoteModule` function accepts a remote name and exposed module path and returns a Promise:

```javascript

const { as, loadRemoteModule, remote } = await initFederation(manifest);


// Basic usage - loads module for side effects (e.g., custom element registration)
await loadRemoteModule('team/button', './Button');

// If the module exports something directly, you can access it
const buttonModule = await loadRemoteModule('team/button', './Button');

// Type-safe usage with TypeScript
const typedComponent = await as<ButtonComponent>().loadTypedModule('team/button', './Button');

// Remote-specific loader
const buttonRemote = remote<ButtonComponent>('team/button');
const button = await buttonRemote.loadModule('./Button');
```

## Error Handling

### Common Issues

**Module Loading Failures**
- Verify `remoteEntry.json` accessibility
- Check CORS configuration on remote hosts
- Validate exposed module names

**Import Map Errors**
- Ensure browser support or include es-module-shims
- Verify module export formats
- Check for naming conflicts

**Dependency Resolution**
- Review version compatibility ranges
- Check `singleton` and `strictVersion` settings
- Examine shared dependency configuration

### Debugging

Enable detailed logging to diagnose issues:

```javascript
{
    logLevel: "debug",
    logger: config.consoleLogger
}
```

Monitor browser developer tools for:
- Network requests to `remoteEntry.json` files
- Import map script injection
- Module loading errors
- Console warnings and errors

## Framework Integration

This library integrates with any frontend framework or backend technology with minimal interference. It only needs plain HTML and support for JavaScript. 

## Next Steps

For comprehensive configuration options and advanced features, see the [Configuration Guide](./config.md), which covers:

- **Host Configuration**: Control critical dependency versions
- **Storage Options**: Choose persistence strategies for different use cases  
- **Import Map Implementations**: Browser compatibility and polyfill options
- **Logging Configuration**: Debug and monitor micro frontend loading
- **Mode Configuration**: Tune dependency resolution and error handling

For deeper understanding of the system:
- Check [Architecture Documentation](./domain.md) for an overview of the concepts. 
- Dive into [Version Resolution](./version-resolver.md) to learn about dependency management.