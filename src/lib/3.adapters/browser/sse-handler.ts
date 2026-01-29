import { BuildNotificationType } from '@softarc/native-federation/domain';
import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';
import { ForSSE } from 'lib/2.app/driving-ports/for-sse.port';
import { LoggingConfig } from 'lib/options.index';

/**
 * Watches for federation build completion events and automatically reloads the page.
 *
 * This function establishes a Server-Sent Events (SSE) connection to listen for
 * 'federation-rebuild-complete' notifications. When a build completes successfully,
 * it triggers a page reload to reflect the latest changes.
 * @param endpoint - The SSE endpoint URL to watch for build notifications.
 */
const createSSEHandler = (config: ImportMapConfig & LoggingConfig): ForSSE => {
  const subscribers: EventSource[] = [];

  return {
    watchRemoteBuilds: function (endpoint: string) {
      const eventSource = new EventSource(endpoint);

      eventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === BuildNotificationType.COMPLETED) {
          config.log.debug(0, '[SSE] Rebuild completed, reloading...');
          config.reloadBrowserFn();
        }
      };

      eventSource.onerror = function (event) {
        config.log.error(0, '[SSE] Connection error:', event);
      };
      subscribers.push(eventSource);
    },
  };
};

export { createSSEHandler };
