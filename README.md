# vanilla-native-federation

A lightweight **runtime micro frontend orchestrator** that loads micro frontends built with native federation into any web page. Unlike other solutions, it caches dependencies across page reloads, making it perfect for traditional server-rendered apps (PHP, Java, Rails, etc.) that refresh on navigation. Drop it into any HTML page with a script tag - no build tools or framework migrations required.

> **Important!** We are planning on releasing v1 soon, for that we need feedback on what is still missing on the library and what is working well. Please feel free to create an issue or feature request. All feedback is welcome!

[![Verify library](https://github.com/topicusonderwijs/vanilla-native-federation/actions/workflows/verify-code.yaml/badge.svg)](https://github.com/topicusonderwijs/vanilla-native-federation/actions/workflows/verify-code.yaml)
![Coverage total](https://raw.githubusercontent.com/topicusonderwijs/vanilla-native-federation/badges/badges/coverage-total.svg)

## Key Features

- ✨ **Zero Framework Dependencies** - Works with any frontend/backend technology
- 🚀 **Simple Drop-in Integration** - Add micro frontends with a single script tag
- 💾 **Advanced Caching** - Optimized for page-reload scenarios with flexible storage options like localStorage and sessionStorage
- 🔄 **Smart Dependency Resolution** - Automatic version conflict resolution and sharing based on the module federation mental model.
- 🌐 **Full Ecosystem Compatibility** - Works with standard remoteEntry.json format.
- ⚡ **Lightweight & Fast** - Minimal bundle size with tree-shaking support.
- 🛠️ **Highly Configurable** - Extensive options and SDK for fine-tuning behavior.

### How it works

The library runs in the browser to orchestrate the integration of micro frontends into plain HTML pages. While the main application can be server-rendered, the micro frontends are loaded as ES modules at runtime, providing the benefits of micro frontend architecture without requiring a full SPA framework for the host.

### Extends the Native Federation Ecosystem

This library provides an alternative runtime to [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime), extending native federation capabilities specifically for non-SPA environments while maintaining full compatibility with the broader ecosystem. It can load any remotes that have been built using [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation) and expose a `remoteEntry.json` metadata file.

### What makes this orchestrator different?

This orchestrator offers the possibility to cache the remoteEntries in localStorage or sessionStorage. This way the downloaded dependencies can be reused, even over multiple page changes. This is not an issue with SPA websites that don't reload the page on rerouting but essential to traditional websites where every route is a full page refresh.

## Quick Start

Get up and running in under 2 minutes:

### 1. Add to your HTML page

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Application</title>

    <!-- Define your micro frontends (remotes) -->
    <script type="application/json" id="mfe-manifest">
      {
        "team/mfe1": "http://localhost:3000/remoteEntry.json",
        "team/mfe2": "http://localhost:4000/remoteEntry.json"
      }
    </script>

    <!-- Handle loaded modules -->
    <script>
      window.addEventListener(
        'mfe-loader-available',
        e => {
          // Load your remote modules, a remote can have multiple modules
          e.detail.loadRemoteModule('team/mfe1', './Button');
          e.detail.loadRemoteModule('team/mfe2', './Header');
        },
        { once: true }
      );
    </script>

    <!-- Include the orchestrator runtime -->
    <script src="https://unpkg.com/vanilla-native-federation@0.19.5/quickstart.mjs"></script>
  </head>
  <body>
    <!-- Use your loaded components -->
    <my-header></my-header>
    <my-button>Click me!</my-button>
  </body>
</html>
```

### 2. That's it! 🎉

Your micro frontends are now loaded and ready to use. The runtime handles:

- ✅ Fetching and processing of remoteEntry.json files
- ✅ Resolving and reuse of shared dependencies
- ✅ Generating an optimized import map based on cached dependencies
- ✅ Loading your remote modules (micro frontends)

### Available quickstart runtime

```html
<!-- Development and quick testing -->
<script src="https://unpkg.com/vanilla-native-federation@0.19.5/quickstart.mjs"></script>
```

## Advanced Usage

The quickstart is intended for experimenting. For production environments it is recommended to use a custom orchestrator based on the vnf library, this gives more control over the initialization process and allows for custom logging implementations like Bugsnag or Sentry rather than the default `consoleLogger`:

```javascript
import { initFederation } from 'vanilla-native-federation';
import { consoleLogger, localStorageEntry } from 'vanilla-native-federation/options';

const { loadRemoteModule } = await initFederation(
  // Manifest
  {
    'team/mfe1': 'http://localhost:3000/remoteEntry.json',
    'team/mfe2': 'http://localhost:4000/remoteEntry.json',
  },
  // Options
  {
    logLevel: 'error',
    logger: consoleLogger,
    storage: localStorageEntry,
    // ... see docs for all available options
  }
);

// Load specific modules
const ButtonComponent = await loadRemoteModule('team/mfe1', './Button');
const HeaderComponent = await loadRemoteModule('team/mfe2', './Header');
```

> 📖 **See the [Configuration Guide](./docs/config.md) for complete configuration options**

## Documentation

| Guide                                                                                                                     | Description                                |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [🚀 Getting Started](https://github.com/topicusonderwijs/vanilla-native-federation/blob/main/docs/getting-started.md)     | Detailed setup instructions and examples   |
| [🏗️ Architecture](https://github.com/topicusonderwijs/vanilla-native-federation/blob/main/docs/architecture.md)           | Understanding the native federation domain |
| [⚙️ Configuration](https://github.com/topicusonderwijs/vanilla-native-federation/blob/main/docs/config.md)                | Complete configuration reference           |
| [🔄 Version Resolution](https://github.com/topicusonderwijs/vanilla-native-federation/blob/main/docs/version-resolver.md) | How dependency conflicts are resolved      |

## Native Federation Ecosystem

This library is part of the broader native federation

| ecosystem:                                                                                                   | Purpose                     |
| ------------------------------------------------------------------------------------------------------------ | --------------------------- |
| [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation)                       | Core build toolchain        |
| [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime)       | Core runtime                |
| **vanilla-native-federation**                                                                                | Alternative runtime         |
| [@angular-architects/native-federation](https://www.npmjs.com/package/@angular-architects/native-federation) | Build toolchain for Angular |

> ✅ **Full compatibility** with standard remoteEntry.json format ensures seamless interoperability

## Alternative orchestrators

While this orchestrator focusses on compatibility and native-federation support. There are other orchestrators out there that provide support for other use cases:

| Package                                                                                                | EcoSystem                                      | Description                                                                |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime) | Native federation                              | The default provided orchestrator for native federation                    |
| [picard](https://github.com/picardjs/picard)                                                           | native-federation, module-federation and Piral | An agnostic orchestrator that focusses on compatibility between ecosystems |
| [@module-federation/runtime](https://www.npmjs.com/package/@module-federation/runtime)                 | module federation                              | The orchestrator specifically for module federation                        |

## Browser Support

- ✅ **Modern browsers**: Native import map support
- ✅ **Legacy browsers**: Available polyfills using [es-module-shims](https://www.npmjs.com/package/es-module-shims)
- ✅ **Framework agnostic**: Accepts React, Angular, Vue, Svelte, etc.

> 🧠 _It is recommended to expose webcomponents as remote modules to ensure maximum compatibility_
