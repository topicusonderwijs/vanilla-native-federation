# vanilla-native-federation

Check the full description of native-federation and their mental model on [@softarc/native-federation](https://www.npmjs.com/package/@softarc/native-federation). This library is specifically made for applications that require a small library to (lazy) load micro frontends or webcomponents on HTML pages using native-federation (e.g. PHP, Ruby or Java applications) without the need for a JavaScript framework. 

This library is under [MIT License](./LICENSE.md), follows the native federation mental model and is inspired on [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime). 

## Goal 

The goal of native federation is to provide a "browser-native" implementation of the mental model introduced by [Webpack module federation](https://webpack.js.org/concepts/module-federation/). This means the focus of native federation has been to provide a framework and bundler agnostic approach for implementing micro frontends into a web application using [importmaps](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap). 

This package is a complete rework of the [@softarc/native-federation-runtime](https://www.npmjs.com/package/@softarc/native-federation-runtime) part of native federation (the adapter that runs in the browser and generates the importmap from the remoteEntry.json metadata files). This library is highly focussed on caching and reusing shared dependencies for optimal performance. But the main goal of this library is to extend beyond the framework agnostic approach and provide a simple implementation for non-SPA (SSR) applications like Java Sevlets, Ruby, PHP etc. The quickstart can be used to test micro frontends in a host application with minimal configuration.

## Quickstart

The library provides quickstart bundles to test running webcomponents in a host application. The library (referred to as orchestrator since it orchestrates micro frontends) can easily be added to a website like shown below: 

```
<html>
    <head>
        <!-- 1. Define manifest -->
        <script type="application/json" id="mfe-manifest">
            {
                "team/mfe1": "http://localhost:3000/remoteEntry.json",
            }
        </script>

        <!-- 3. Load modules -->
        <script>
            <!-- event will be fired if native-federation initialization is done -->
            window.addEventListener('mfe-loader-available', (e) => {
                e.detail.loadRemoteModule("team/mfe1", "<your-exposed-comp>");
            }, {once: true});
        </script>

        <!-- 2. Load orchestrator -->
        <script src="https://unpkg.com/vanilla-native-federation@0.12.2/quickstart/debug.mjs"></script>
    </head>
    <body>
        <!-- 4. Define custom elements (optional)  -->
        <team-mfe1></team-mfe1>
    </body>
</html>
```

### 1. Define manifest

The library requires a manifest to figure out which exposed modules and required dependencies to put in the importmap. A manifest a map with the names of the 'remotes' as key and the location of their remoteEntry.json metadata file as values.

### 2. Load orchestrator

As mentioned before, there are 2 exposed "quickstart" bundles (debug and test) that will automatically run the `initFederation` function with basic  debugging configuration. The bundle will look for a `<script type="application/json" id="mfe-manifest">` or `<meta name="mfe-feed" content="{url}">` tag in the DOM and use that to download and process all the remoteEntry.json metadata files. 

### 3. Load remote modules

Whenever the `initFederation` function is done, it will fire a `mfe-loader-available` custom event at the DOM's window object. Hence it is important to define the eventListener before the orchestrator script tag (step 2). The event contains the callback `loadRemoteModule` which will import (download) an exposed ES module based on the name of the remote and the name of the exposed module defined in the remote's remoteEntry.json. 

### 4. Define custom elements (optional) 

It is possible to load [custom HTML elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) in the exposed modules, this is also the easiest way to implement framework agnostic micro frontends and encapsulate functionality in a custom HTML element. The `loadRemoteModule()` function returns a Promise of the imported module which can be used to call specific mount/unmount of the exposed custom element. Manfred Steyer created an elegant solution on how to create [Angular custom elements](https://github.com/manfredsteyer/module-federation-plugin-example/blob/nf-web-comp-mixed/projects/mfe2/src/bootstrap.ts) but it is also possible to use React, Vue or any other library/framework. 

Check out the "more info" section if you want to learn more about the concept of micro frontends and native federation.

## Documentation

Learn more about the vanilla-native-federation library:

1. [Getting started](./docs/getting-started.md)
2. [Exploring the native-federation domain](./docs/domain.md)
3. [Configuring the vanilla-native-federation library](./docs/config.md)
4. [A deep dive into the externals version resolver](./docs/version-resolver.md)

## More info

If you want to know more about Native federation, check out these sources: 

- [Talk by Manfred Steyer](https://www.youtube.com/watch?v=cofoI5_S3lE)
- [The official @softarc/native-federation package](https://www.npmjs.com/package/@softarc/native-federation)
- [The @angular-architects/native-federation package](https://www.npmjs.com/package/@angular-architects/native-federation)
- [Angular-architects blogpost](https://www.angulararchitects.io/blog/announcing-native-federation-1-0/)
- [Angular-architects tutorial](https://www.angulararchitects.io/en/blog/micro-frontends-with-modern-angular-part-1-standalone-and-esbuild/)
- [Some examples](https://github.com/angular-architects/module-federation-plugin/tree/main/apps)