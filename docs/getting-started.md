[< back](./../README.md)

# Getting started

A preconfigured setup of the `vanilla-native-federation` can be used in a HTML file to experiment with the notion of native federation. The orchestrator can be added to the host as follows:

```
<html>
    <head>
        <title>Shell</title>
        <script type="application/json" id="manifest">
            {
                "team/mfe1": "http://localhost:3000/remoteEntry.json",
            }
        </script>
        <script>
            <!-- event will be fired if native-federation initialization is done -->
            window.addEventListener('mfe-loader-available', (e) => {
                e.loadRemoteModule("team/mfe1", "./comp");
            }, {once: true});
        </script>
        <script src="https://unpkg.com/vanilla-native-federation@0.12.0/quickstart/debug.mjs"></script>
    </head>
    <body>
        <!-- Name of your custom element -->
        <team-mfe1></team-mfe1>
    </body>
</html>
```

The quickstart will look for a script in the HTML file with the id "manifest". Based on this script, it will initialize the defined `Remotes`.