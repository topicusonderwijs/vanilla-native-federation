import 'es-module-shims';

import { initFederation } from '../../lib/init-federation';
import { consoleLogger } from '../logging';
import { useImportMapShim } from '../module-loader';

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
        logLevel: "debug", 
        ...useImportMapShim("default"),
        importMapType: 'importmap'
    }).then(({load}) => {
        (window as any).loadRemoteModule = load
        window.dispatchEvent(new CustomEvent("mfe-loader-available", {detail: {load}}));
    });
})();