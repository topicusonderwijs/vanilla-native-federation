# vanilla-native-federation

[![Verify library](https://github.com/topicusonderwijs/vanilla-native-federation/actions/workflows/verify-code.yaml/badge.svg)](https://github.com/topicusonderwijs/vanilla-native-federation/actions/workflows/verify-code.yaml)

```
$ npm install vanilla-native-federation
```


A lightweight runtime library for implementing native federation in server-side rendered applications. Built on the foundation of [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime) and designed specifically for non-SPA environments like PHP, Ruby, Java, and ASP.NET applications.

## Key Features

- ✨ **Zero Framework Dependencies** - Works with any frontend/backend technology  
- 🚀 **Simple Drop-in Integration** - Add micro frontends with a single script tag  
- 💾 **Advanced Caching** - Optimized for page-reload scenarios with flexible storage options like localStorage and sessionStorage
- 🔄 **Smart Dependency Resolution** - Automatic version conflict resolution and sharing based on the module federation mental model.
- 🌐 **Full Ecosystem Compatibility** - Works with standard remoteEntry.json format.
- ⚡ **Lightweight & Fast** - Minimal bundle size with tree-shaking support.
- 🛠️ **Highly Configurable** - Extensive options and SDK for fine-tuning behavior.

### Built for (SSR) applications

This particular library is specialized for **server-side rendered applications** that need micro frontend capabilities without the complexity of SPA frameworks. Whether you're building with PHP, Ruby on Rails, Django, Spring Boot, or ASP.NET, this library provides a seamless integration path.

### Extends the Native Federation Ecosystem
Built upon the excellent [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime), this library extends native federation capabilities specifically for SSR environments while maintaining full compatibility with the broader ecosystem. Alternatively, this library is also really easy to integrate into SPA frameworks instead of the original runtime. 

## Quick Start

Get up and running in under 2 minutes:

### 1. Add to your HTML page

```html
<!DOCTYPE html>
<html>
    <head>
        <title>My Application</title>
        
        <!-- Define your micro frontends -->
        <script type="application/json" id="mfe-manifest">
            {
                "team/mfe1": "http://localhost:3000/remoteEntry.json",
                "team/mfe2": "http://localhost:4000/remoteEntry.json"
            }
        </script>
        
        <!-- Handle loaded modules -->
        <script>
            window.addEventListener('mfe-loader-available', (e) => {
                // Load your micro frontends
                e.detail.loadRemoteModule("team/mfe1", "./Button");
                e.detail.loadRemoteModule("team/mfe2", "./Header");
            }, {once: true});
        </script>
        
        <!-- Include the runtime -->
        <script src="https://unpkg.com/vanilla-native-federation@0.12.6/quickstart/debug.mjs"></script>
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
- ✅ Fetching and processing remoteEntry.json files
- ✅ Resolving shared dependencies
- ✅ Generating optimized import maps
- ✅ Loading your micro frontend modules

### Available quickstart Runtimes

```html
<!-- Development: Detailed logging -->
<script src="https://unpkg.com/vanilla-native-federation@0.12.6/quickstart/debug.mjs"></script>

<!-- Production: Optimized for performance -->
<script src="https://unpkg.com/vanilla-native-federation@0.12.6/quickstart/test.mjs"></script>
```

## Advanced Usage

For more control over the initialization process:

```javascript
import { initFederation, config } from 'vanilla-native-federation';

const { loadRemoteModule } = await initFederation({
    "team/mfe1": "http://localhost:3000/remoteEntry.json",
    "team/mfe2": "http://localhost:4000/remoteEntry.json"
}, {
    // Extensive configuration options available
    logLevel: "error",
    logger: config.consoleLogger,
    storage: config.localStorageEntry,
    // ... see docs for full options
});

// Load specific modules
const ButtonComponent = await loadRemoteModule('team/mfe1', './Button');
const HeaderComponent = await loadRemoteModule('team/mfe2', './Header');
```

> 📖 **See the [Configuration Guide](./docs/config.md) for complete configuration options**

## Documentation

| Guide | Description |
|-------|-------------|
| [🚀 Getting Started](./docs/getting-started.md) | Detailed setup instructions and examples |
| [🏗️ Architecture](./docs/architecture.md) | Understanding the native federation domain |
| [⚙️ Configuration](./docs/config.md) | Complete configuration reference |
| [🔄 Version Resolution](./docs/version-resolver.md) | How dependency conflicts are resolved |

## Native Federation Ecosystem

This library is part of the broader native federation ecosystem:

| Package | Purpose | Best For |
|---------|---------|----------|
| [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation) | Build toolchain | Creating federated applications |
| [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime) | SPA runtime | React, Angular, Vue applications |
| **vanilla-native-federation** | SSR runtime | PHP, Ruby, Java, .NET applications |
| [@angular-architects/native-federation](https://www.npmjs.com/package/@angular-architects/native-federation) | Angular integration | Angular-specific features |

> 🔗 **Full compatibility** with standard remoteEntry.json format ensures seamless interoperability

## Browser Support

- ✅ **Modern browsers**: Native import map support
- ✅ **Legacy browsers**: Automatic polyfill with [es-module-shims](https://www.npmjs.com/package/es-module-shims)
- ✅ **All major frameworks**: React, Angular, Vue, Svelte, etc.

```html
<!-- Add for legacy browser support -->
<script async src="https://ga.jspm.io/npm:es-module-shims@2.5.1/dist/es-module-shims.js"></script>
```

## Contributing & Support

### 🤝 Contributing
We welcome contributions! See our [Contributing Guide](./CONTRIBUTING.md) for the development setup, code standards, our pull request process or issue reporting.

### 📚 Learn More
Dive deeper into native federation concepts:
- [📺 Native Federation Overview](https://www.youtube.com/watch?v=cofoI5_S5lE) by Manfred Steyer
- [📝 Announcing Native Federation 1.0](https://www.angulararchitects.io/blog/announcing-native-federation-1-0/)
- [🎓 Micro Frontends Tutorial](https://www.angulararchitects.io/en/blog/micro-frontends-with-modern-angular-part-1-standalone-and-esbuild/)
- [💻 Example Applications](https://github.com/angular-architects/module-federation-plugin/tree/main/apps)

### 👀 Examples

- [Wicket + Angular](github.com/Aukevanoost/native-federation-examples)
- _your solution?_


### 📄 License
MIT License - see [LICENSE.md](./LICENSE.md) for details.

---

**Made with ❤️ for the native federation community**