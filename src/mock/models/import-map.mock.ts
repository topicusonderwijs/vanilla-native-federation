const mockImportMap = {
    baseUrlToRemoteNames: { "http://localhost:4200": "team/mfe1" },
    externals: {
        "rxjs/operators@7.8.1": "http://localhost:4200/rxjs_operators.js",
        "rxjs@7.8.1": "http://localhost:4200/rxjs.js",
        "tslib@2.8.1": "http://localhost:4200/tslib.js"
    },
    remoteNamesToRemote: {
        baseUrl: "http://localhost:4200",
        exposes: {key: "./comp", outFileName: "comp.js"}
    },
    shared: [
        {
            packageName: "rxjs",
            outFileName: "rxjs.4GPkYDz88F-dev.js",
            requiredVersion: "~7.8.0",
            singleton: true,
            strictVersion: true,
            version: "7.8.1",
        },
        {
            packageName: "rxjs/operators",
            outFileName: "rxjs_operators.eeFEpqH8Aa-dev.js",
            requiredVersion: "~7.8.0",
            singleton: true,
            strictVersion: true,
            version: "7.8.1",
        },
        {
            packageName: "tslib",
            outFileName: "tslib.lVpN-2v1UB-dev.js",
            requiredVersion: "^2.3.0",
            singleton: true,
            strictVersion: true,
            version: "2.8.1",
        },
    ]
}