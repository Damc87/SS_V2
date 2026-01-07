import { create } from 'zustand';
import { toast } from 'sonner';
import type { Project, MainPhase, Subphase, Contractor, Cost, CostInput, CostListResult, Document, PhasesImportResult } from '../types';

export type DataState = {
  projects: Project[];
  activeProjectId: string | null;
  phases: MainPhase[];
  subphases: Record<string, Subphase[]>;
  contractors: Contractor[];
  costs: Cost[];
  costTotal: number;
  documents: Document[];
  loading: boolean;
  error?: string | null;
  refreshAll: () => Promise<void>;
  loadAll: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
  addProject: (payload: Pick<Project, 'name' | 'description' | 'net_m2'>) => Promise<Project>;
  updateProject: (id: string, payload: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshCosts: (filters?: { projectId?: string } & Record<string, unknown>) => Promise<void>;
  refreshContractors: (projectId?: string) => Promise<void>;
  createCost: (payload: CostInput) => Promise<Cost>;
  updateCost: (id: string, patch: Partial<CostInput>) => Promise<Cost | null>;
  archiveCost: (id: string, archived: boolean) => Promise<Cost | null>;
  deleteCost: (id: string) => Promise<void>;
  attachCostPdf: (id: string, filePath: string) => Promise<void>;
  duplicateCost: (id: string) => Promise<Cost | null>;
  importCosts: (csv: string, projectId: string) => Promise<unknown>;
  exportCosts: (projectId?: string, filters?: Record<string, unknown>) => Promise<string>;
  phasePlanVsActual: (projectId?: string) => Promise<unknown>;
  refreshDocuments: (projectId: string) => Promise<void>;
  refreshPhases: () => Promise<void>;
  addPhase: (payload: { name: string; order_no?: number; project_id?: string }) => Promise<void>;
  updatePhase: (id: string, payload: { name?: string; budget_planned?: number; order_no?: number }) => Promise<void>;
  deletePhase: (id: string) => Promise<void>;
  addSubphase: (phaseId: string, payload: { name: string; order_no?: number }) => Promise<void>;
  updateSubphase: (id: string, payload: { name?: string; order_no?: number; main_phase_id?: string }) => Promise<void>;
  deleteSubphase: (id: string) => Promise<void>;
  importPhasesCsv: (csv: string) => Promise<PhasesImportResult | null>;
  createContractor: (payload: Omit<Contractor, 'id' | 'created_at'>) => Promise<Contractor>;
  updateContractor: (id: string, patch: Partial<Omit<Contractor, 'id' | 'created_at'>>) => Promise<Contractor | null>;
  archiveContractor: (id: string, archived: boolean) => Promise<Contractor | null>;
  deleteContractor: (id: string) => Promise<void>;
};

export const useData = create<DataState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  phases: [],
  subphases: {},
  contractors: [],
  costs: [],
  costTotal: 0,
  documents: [],
  loading: false,
  error: null,
  async refreshAll() {
    set({ loading: true });
    try {
      const activeProjectId = await window.api.projects.getActive();
      const projectsRaw = await window.api.projects.list();
      const projects = projectsRaw.filter((p) => !p.is_archived);
      const contractors = await window.api.contractors.list({ projectId: activeProjectId ?? undefined, includeArchived: true });
      set({ projects, contractors, activeProjectId: activeProjectId ?? null });
      await get().refreshPhases();
      const fallback = projects[0]?.id;
      if (activeProjectId ?? fallback) {
        await get().setActiveProject(activeProjectId ?? fallback);
      }
    } catch (error) {
      console.error('refreshAll failed', error);
      toast.error('Osvežitev ni uspela.');
    } finally {
      set({ loading: false });
    }
  },
  async refreshPhases() {
    try {
      const { activeProjectId } = get();
      const phases = await window.api.phases.list();
      const filtered = activeProjectId ? phases.filter((p) => !p.project_id || p.project_id === activeProjectId) : phases;
      const subphases: Record<string, Subphase[]> = {};
      await Promise.all(
        filtered.map(async (p: MainPhase) => {
          subphases[p.id] = await window.api.phases.subphases.list(p.id);
        })
      );
      set({ phases: filtered, subphases });
    } catch (error) {
      console.error('refreshPhases failed', error);
      toast.error('Nalaganje faz ni uspelo.');
    }
  },
  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [projectsRaw, contractorsRaw, activeProjectId] = await Promise.all([
        window.api.projects.list(),
        window.api.contractors.list({ includeArchived: true }),
        window.api.projects.getActive(),
      ]);
      const projects = projectsRaw.filter((p) => !p.is_archived);
      const contractors = contractorsRaw;
      await get().refreshPhases();
      set({ projects, contractors, activeProjectId: activeProjectId ?? null, loading: false });

      const current = activeProjectId ?? projects[0]?.id;
      if (current) {
        await get().setActiveProject(current);
      }
    } catch (error) {
      console.error('loadAll failed', error);
      toast.error('Nalaganje podatkov ni uspelo.');
      set({ loading: false, error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  setActiveProject: async (id: string) => {
    try {
      set({ activeProjectId: id });
      await window.api.projects.setActive(id);
      const { items, total } = (await window.api.costs.list({ projectId: id, includeArchived: true })) as CostListResult;
      const documents = await window.api.documents.listByProject(id);
      const contractors = await window.api.contractors.list({ projectId: id, includeArchived: true });
      set({ activeProjectId: id, costs: items, costTotal: total, documents, contractors, error: null });
      await get().refreshPhases();
    } catch (error) {
      console.error('setActiveProject failed', error);
      toast.error('Aktivacija projekta ni uspela.');
      set({ error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  refreshContractors: async (projectId) => {
    const current = projectId ?? get().activeProjectId;
    if (!current) return;
    try {
      const contractors = await window.api.contractors.list({ projectId: current, includeArchived: true });
      set({ contractors });
    } catch (error) {
      console.error('refreshContractors failed', error);
      toast.error('Osvežitev izvajalcev ni uspela.');
    }
  },
  addProject: async (payload) => {
    try {
      const project = await window.api.projects.create(payload);
      await get().loadAll();
      return project;
    } catch (error) {
      console.error('addProject failed', error);
      toast.error('Shranjevanje projekta ni uspelo.');
      throw error;
    }
  },
  updateProject: async (id, payload) => {
    try {
      const updated = await window.api.projects.update(id, payload);
      await get().loadAll();
      return updated;
    } catch (error) {
      console.error('updateProject failed', error);
      toast.error('Posodobitev projekta ni uspela.');
      throw error;
    }
  },
  deleteProject: async (id: string) => {
    try {
      await window.api.projects.remove(id);
      await get().loadAll();
    } catch (error) {
      console.error('deleteProject failed', error);
      toast.error('Brisanje projekta ni uspelo.');
      throw error;
    }
  },
  refreshCosts: async (filters = {}) => {
    const { projectId = get().activeProjectId, ...rest } = filters;
    if (!projectId) return;
    try {
      const { items, total } = (await window.api.costs.list({ includeArchived: true, ...rest, projectId })) as CostListResult;
      set({ costs: items, costTotal: total });
    } catch (error) {
      console.error('refreshCosts failed', error);
      toast.error('Osvežitev stroškov ni uspela.');
      set({ error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  createCost: async (payload) => {
    try {
      const cost = await window.api.costs.create(payload);
      await get().refreshCosts({ projectId: payload.project_id });
      return cost;
    } catch (error) {
      console.error('createCost failed', error);
      toast.error('Shranjevanje stroška ni uspelo.');
      throw error;
    }
  },
  updateCost: async (id, patch) => {
    try {
      const updated = await window.api.costs.update(id, patch);
      if (updated) {
        set((state) => ({ costs: state.costs.map((c) => (c.id === id ? updated : c)) }));
      }
      return updated;
    } catch (error) {
      console.error('updateCost failed', error);
      toast.error('Posodobitev stroška ni uspela.');
      throw error;
    }
  },
  archiveCost: async (id, archived) => {
    try {
      const updated = await window.api.costs.setArchived(id, archived);
      if (updated) {
        set((state) => ({ costs: state.costs.map((c) => (c.id === id ? updated : c)) }));
      }
      return updated;
    } catch (error) {
      console.error('archiveCost failed', error);
      toast.error('Sprememba arhiva stroška ni uspela.');
      throw error;
    }
  },
  deleteCost: async (id) => {
    try {
      await window.api.costs.remove(id);
      set((state) => ({ costs: state.costs.filter((c) => c.id !== id) }));
    } catch (error) {
      console.error('deleteCost failed', error);
      toast.error('Brisanje stroška ni uspelo.');
      throw error;
    }
  },
  attachCostPdf: async (id, filePath) => {
    try {
      const meta = await window.api.costs.attachPdf(id, filePath);
      if (meta) {
        set((state) => ({ costs: state.costs.map((c) => (c.id === id ? { ...c, pdf_attachment: meta } : c)) }));
      }
    } catch (error) {
      console.error('attachCostPdf failed', error);
      toast.error('Nalaganje PDF ni uspelo.');
      throw error;
    }
  },
  duplicateCost: async (id) => {
    try {
      const copy = await window.api.costs.duplicate(id);
      if (copy) {
        set((state) => ({ costs: [copy, ...state.costs] }));
      }
      return copy;
    } catch (error) {
      console.error('duplicateCost failed', error);
      toast.error('Podvajanje stroška ni uspelo.');
      throw error;
    }
  },
  importCosts: async (csv, projectId) => {
    try {
      const result = await window.api.import.csv(csv, projectId);
      const created = (result as { created?: unknown[] } | null)?.created;
      if (created?.length) {
        await get().refreshCosts({ projectId });
      }
      return result;
    } catch (error) {
      console.error('importCosts failed', error);
      toast.error('Uvoz CSV ni uspel.');
      throw error;
    }
  },
  exportCosts: async (projectId, filters = {}) => {
    try {
      return await window.api.export.csv(projectId, filters);
    } catch (error) {
      console.error('exportCosts failed', error);
      toast.error('Izvoz CSV ni uspel.');
      throw error;
    }
  },
  phasePlanVsActual: async (projectId) => {
    const current = projectId ?? get().activeProjectId;
    if (!current) return [];
    try {
      return await window.api.costs.planVsActual(current);
    } catch (error) {
      console.error('phasePlanVsActual failed', error);
      return [];
    }
  },
  refreshDocuments: async (projectId) => {
    try {
      const documents = await window.api.documents.listByProject(projectId);
      set({ documents });
    } catch (error) {
      console.error('refreshDocuments failed', error);
      toast.error('Osvežitev dokumentov ni uspela.');
    }
  },
  addPhase: async (payload) => {
    try {
      const project_id = get().activeProjectId;
      if (!project_id) {
        throw new Error('Ni aktivnega projekta');
      }
      await window.api.phases.create({ ...payload, project_id });
      await get().refreshPhases();
      set({ error: null });
    } catch (error) {
      console.error('addPhase failed', error);
      toast.error('Dodajanje faze ni uspelo.');
      set({ error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  updatePhase: async (id, payload) => {
    try {
      await window.api.phases.update(id, payload);
      await get().refreshPhases();
    } catch (error) {
      console.error('updatePhase failed', error);
      toast.error('Posodobitev faze ni uspela.');
    }
  },
  deletePhase: async (id) => {
    try {
      await window.api.phases.remove(id);
      await get().refreshPhases();
    } catch (error) {
      console.error('deletePhase failed', error);
      toast.error('Brisanje faze ni uspelo.');
    }
  },
  addSubphase: async (phaseId, payload) => {
    try {
      await window.api.phases.subphases.create(phaseId, payload);
      await get().refreshPhases();
    } catch (error) {
      console.error('addSubphase failed', error);
      toast.error('Dodajanje podfaze ni uspelo.');
    }
  },
  updateSubphase: async (id, payload) => {
    try {
      await window.api.phases.subphases.update(id, payload);
      await get().refreshPhases();
    } catch (error) {
      console.error('updateSubphase failed', error);
      toast.error('Posodobitev podfaze ni uspela.');
    }
  },
  deleteSubphase: async (id) => {
    try {
      await window.api.phases.subphases.remove(id);
      await get().refreshPhases();
    } catch (error) {
      console.error('deleteSubphase failed', error);
      toast.error('Brisanje podfaze ni uspelo.');
    }
  },
  importPhasesCsv: async (csv) => {
    try {
      const projectId = get().activeProjectId;
      if (!projectId) {
        throw new Error('Ni aktivnega projekta');
      }
      const result = (await window.api.phases.importCsv(csv, projectId)) as PhasesImportResult;
      await get().refreshPhases();
      return result;
    } catch (error) {
      console.error('importPhasesCsv failed', error);
      toast.error((error as Error)?.message ?? 'Uvoz faz ni uspel.');
      return null;
    }
  },
  createContractor: async (payload) => {
    try {
      const contractor = await window.api.contractors.create(payload);
      await get().refreshContractors(payload.project_id);
      return contractor;
    } catch (error) {
      console.error('createContractor failed', error);
      toast.error('Shranjevanje izvajalca ni uspelo.');
      throw error;
    }
  },
  updateContractor: async (id, patch) => {
    try {
      const contractor = await window.api.contractors.update(id, patch);
      if (contractor) {
        set((state) => ({
          contractors: state.contractors.map((c) => (c.id === id ? contractor : c)),
        }));
      }
      return contractor;
    } catch (error) {
      console.error('updateContractor failed', error);
      toast.error('Posodobitev izvajalca ni uspela.');
      throw error;
    }
  },
  archiveContractor: async (id, archived) => {
    try {
      const contractor = await window.api.contractors.archive(id, archived);
      if (contractor) {
        set((state) => ({
          contractors: state.contractors.map((c) => (c.id === id ? contractor : c)),
        }));
      }
      return contractor;
    } catch (error) {
      console.error('archiveContractor failed', error);
      toast.error('Posodobitev arhiva izvajalca ni uspela.');
      throw error;
    }
  },
  deleteContractor: async (id) => {
    try {
      await window.api.contractors.remove(id);
      set((state) => ({ contractors: state.contractors.filter((c) => c.id !== id) }));
    } catch (error) {
      console.error('deleteContractor failed', error);
      toast.error('Brisanje izvajalca ni uspelo.');
      throw error;
    }
  },
}));

export const useProjects = () => useData((state) => state.projects);
export const useActiveProjectId = () => useData((state) => state.activeProjectId);
export const usePhases = () => useData((state) => state.phases);
export const useSubphases = () => useData((state) => state.subphases);
export const useContractors = () => useData((state) => state.contractors);
export const useCosts = () => useData((state) => state.costs);
export const useCostTotal = () => useData((state) => state.costTotal);
export const useDocuments = () => useData((state) => state.documents);
export const useLoading = () => useData((state) => state.loading);
export const useError = () => useData((state) => state.error);
