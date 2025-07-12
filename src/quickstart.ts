import 'es-module-shims';

import { initFederation } from 'lib/init-federation';
import { consoleLogger } from 'lib/4.config/logging/console.logger';
import { useShimImportMap } from 'lib/4.config/import-map/use-import-shim';

(async () => {
  let manifest: Record<string, string> | undefined | string = undefined;

  /**
   * Option 1: supply a feed URL.
   * HTML tag: <meta name="mfe-feed" content="{url}">
   */
  const url = document.querySelector('meta[name="mfe-feed"]')?.getAttribute('content');
  if (!!url) {
    manifest = url;
  }

  /**
   * Option 2: supply a manifest object.
   * HTML tag: <script type="application/json" id="mfe-manifest">
   */
  const jsonScript = document.getElementById('mfe-manifest');
  if (!manifest && !!jsonScript?.textContent) {
    manifest = JSON.parse(jsonScript.textContent);
  }

  if (!manifest) {
    console.error(`Please provide a manifest in the HTML file: 
<script type="application/json" id="mfe-manifest">
    {
        "remote1": "http://localhost:3000/remoteEntry.json",
        [...]
    }
</script>`);
    return;
  }

  await initFederation(manifest, {
    logger: consoleLogger,
    logLevel: 'warn',
    ...useShimImportMap({ shimMode: true }),
    importMapType: 'importmap',
  }).then(({ loadRemoteModule }) => {
    (window as any).loadRemoteModule = loadRemoteModule;
    window.dispatchEvent(new CustomEvent('mfe-loader-available', { detail: { loadRemoteModule } }));
  });
})();
