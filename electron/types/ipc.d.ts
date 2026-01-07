import type { IpcRendererEvent } from 'electron';
import type { PhasesImportResult } from './models';

export type MainChannels =
  | 'projects:list'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'projects:setActive'
  | 'projects:getActive'
  | 'phases:list'
  | 'phases:create'
  | 'phases:update'
  | 'phases:delete'
  | 'phases:importCsv'
  | 'subphases:create'
  | 'subphases:update'
  | 'subphases:delete'
  | 'subphases:list'
  | 'phases:reorder'
  | 'contractors:list'
  | 'contractors:create'
  | 'contractors:update'
  | 'contractors:delete'
  | 'contractors:archive'
  | 'costs:list'
  | 'costs:create'
  | 'costs:update'
  | 'costs:delete'
  | 'costs:duplicate'
  | 'costs:bulkCreate'
  | 'costs:planVsActual'
  | 'costs:setArchived'
  | 'costs:attachPdf'
  | 'costs:openPdf'
  | 'documents:attach'
  | 'documents:listByProject'
  | 'documents:open'
  | 'documents:delete'
  | 'export:csv'
  | 'import:csv'
  | 'export:backup'
  | 'import:backup'
  | 'paths:userData'
  | 'app:openPath';

declare global {
  interface Window {
    api: {
      projects: {
        list: () => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
        setActive: (id: string) => Promise<string | null>;
        getActive: () => Promise<string | null>;
      };
      phases: {
        list: () => Promise<any>;
        create: (payload: any) => Promise<any>;
        update: (id: string, payload: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
        reorder: (order: string[]) => Promise<any>;
        importCsv: (csv: string, projectId: string) => Promise<PhasesImportResult>;
        subphases: {
          list: (phaseId: string) => Promise<any>;
          create: (phaseId: string, payload: any) => Promise<any>;
          update: (id: string, payload: any) => Promise<any>;
          remove: (id: string) => Promise<void>;
        };
      };
      contractors: {
        list: (filters?: { projectId?: string; includeArchived?: boolean }) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
        archive: (id: string, archived: boolean) => Promise<any>;
      };
      costs: {
        list: (filters: Record<string, unknown>) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
        duplicate: (id: string) => Promise<any>;
        bulkCreate: (entries: any[]) => Promise<any>;
        planVsActual: (projectId: string) => Promise<any>;
        setArchived: (id: string, archived: boolean) => Promise<any>;
        attachPdf: (costId: string, filePath: string) => Promise<any>;
        openPdf: (storedPath: string) => Promise<any>;
      };
      documents: {
        attach: (payload: { projectId: string; costId?: string; filePath: string }) => Promise<any>;
        listByProject: (projectId: string) => Promise<any>;
        open: (storedPath: string) => Promise<any>;
        remove: (id: string) => Promise<void>;
      };
      export: {
        csv: (projectId?: string, filters?: Record<string, unknown>) => Promise<string>;
        backup: () => Promise<string | null>;
      };
      import: {
        csv: (csv: string, projectId: string) => Promise<any>;
        backup: () => Promise<boolean | null>;
      };
      paths: {
        userData: () => Promise<string>;
      };
      app: {
        openPath: (targetPath: string) => Promise<string>;
      };
      on: (channel: MainChannels, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      removeListener: (channel: MainChannels, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
    };
  }
}
