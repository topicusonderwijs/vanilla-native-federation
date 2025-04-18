
import 'es-module-shims';

import { initFederation } from '../lib/init-federation';
import { consoleLogger } from '../lib/4.config/logging/console.logger';
import { useShimImportMap } from '../lib/4.config/import-map/use-import-shim';

(async () => {
    const jsonScript = document.getElementById('manifest');
    
    if(!jsonScript?.textContent) {
        console.error(`Please provide a manifest in the HTML file: 
<script type="application/json" id="manifest">
    {
        "remote1": "http://localhost:3000/remoteEntry.json",
        [...]
    }
</script>`);
        return;
    }

    await initFederation(JSON.parse(jsonScript.textContent), {
        logger: consoleLogger, 
        logLevel: "error", 
        ...useShimImportMap(),
        importMapType: 'importmap'
    }).then(({loadRemoteModule}) => {
        (window as any).loadRemoteModule = loadRemoteModule
        window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {loadRemoteModule}}));
    });
})();