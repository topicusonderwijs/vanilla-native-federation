import { BuildNotificationType } from '@softarc/native-federation/domain';
import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';
import { ForSSE } from 'lib/2.app/driving-ports/for-sse.port';

/**
 * Watches for federation build completion events and automatically reloads the page.
 *
 * This function establishes a Server-Sent Events (SSE) connection to listen for
 * 'federation-rebuild-complete' notifications. When a build completes successfully,
 * it triggers a page reload to reflect the latest changes.
 * @param endpoint - The SSE endpoint URL to watch for build notifications.
 */
const createSSEHandler = (_: ImportMapConfig): ForSSE => {
  return {
    watchRemoteBuilds: function (endpoint: string) {
      const eventSource = new EventSource(endpoint);

      eventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === BuildNotificationType.COMPLETED) {
          console.log('[Federation] Rebuild completed, reloading...');
          window.location.reload();
        }
      };

      eventSource.onerror = function (event) {
        console.warn('[Federation] SSE connection error:', event);
      };
    },
  };
};

export { createSSEHandler };
