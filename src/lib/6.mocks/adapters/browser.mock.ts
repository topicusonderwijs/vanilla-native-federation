import { ForBrowserTasks } from 'lib/2.app/driving-ports/for-browser-tasks';

export const mockBrowser = (): jest.Mocked<ForBrowserTasks> => ({
  setImportMapFn: jest.fn(),
  importModule: jest.fn(),
});
