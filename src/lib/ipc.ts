import type { MainChannels } from '@electron/types/ipc';

export const ipc = new Proxy(
  {},
  {
    get: (_target, prop: string) => {
      return (...args: any[]) => window.electron.invoke(prop as MainChannels, ...args);
    },
  }
) as { [K in MainChannels]: (...args: any[]) => Promise<any> };
