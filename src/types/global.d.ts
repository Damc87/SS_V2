import type { Contractor, Cost, CostInput, CostListResult, Document, MainPhase, PhasesImportResult, Project, Subphase } from './types';

declare global {
  interface Window {
    api: {
      projects: {
        list: () => Promise<Project[]>;
        create: (data: Omit<Project, 'id' | 'created_at'>) => Promise<Project>;
        update: (id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) => Promise<Project | null>;
        remove: (id: string) => Promise<void>;
        setActive: (id: string) => Promise<string | null>;
        getActive: () => Promise<string | null>;
      };
      phases: {
        list: () => Promise<MainPhase[]>;
        create: (payload: { name: string; order_no?: number; id?: string; project_id?: string }) => Promise<MainPhase>;
        update: (id: string, payload: string | { name?: string; budget_planned?: number; order_no?: number }) => Promise<MainPhase | null>;
        remove: (id: string) => Promise<void>;
        reorder: (order: string[]) => Promise<MainPhase[]>;
        importCsv: (csv: string, projectId: string) => Promise<PhasesImportResult>;
        subphases: {
          list: (phaseId: string) => Promise<Subphase[]>;
          create: (phaseId: string, payload: { name: string; order_no?: number; id?: string }) => Promise<Subphase>;
          update: (id: string, payload: { name?: string; order_no?: number; main_phase_id?: string }) => Promise<Subphase | null>;
          remove: (id: string) => Promise<void>;
        };
      };
      contractors: {
        list: (filters?: { projectId?: string; includeArchived?: boolean }) => Promise<Contractor[]>;
        create: (data: Omit<Contractor, 'id' | 'created_at'>) => Promise<Contractor>;
        update: (id: string, data: Partial<Omit<Contractor, 'id' | 'created_at'>>) => Promise<Contractor | null>;
        remove: (id: string) => Promise<void>;
        archive: (id: string, archived: boolean) => Promise<Contractor | null>;
      };
      costs: {
        list: (filters: Record<string, unknown>) => Promise<CostListResult>;
        create: (data: CostInput) => Promise<Cost>;
        update: (id: string, data: Partial<CostInput>) => Promise<Cost | null>;
        remove: (id: string) => Promise<void>;
        duplicate: (id: string) => Promise<Cost | null>;
        bulkCreate: (entries: CostInput[]) => Promise<Cost[]>;
        planVsActual: (projectId: string) => Promise<unknown>;
        setArchived: (id: string, archived: boolean) => Promise<Cost | null>;
        attachPdf: (costId: string, filePath: string) => Promise<Cost['pdf_attachment'] | null>;
        openPdf: (storedPath: string) => Promise<string>;
      };
      documents: {
        attach: (payload: { projectId: string; costId?: string; filePath: string }) => Promise<Document>;
        listByProject: (projectId: string) => Promise<Document[]>;
        open: (storedPath: string) => Promise<string>;
        remove: (id: string) => Promise<void>;
        update: (id: string, data: Partial<Document>) => Promise<Document | null>;
        replace: (id: string, filePath: string) => Promise<Document>;
      };
      export: {
        csv: (projectId?: string, filters?: Record<string, unknown>) => Promise<string>;
        backup: () => Promise<string | null>;
      };
      import: {
        csv: (csv: string, projectId: string) => Promise<unknown>;
        backup: () => Promise<boolean | null>;
      };
      paths: {
        userData: () => Promise<string>;
      };
      app: {
        openPath: (targetPath: string) => Promise<string>;
      };
    };
  }
}
