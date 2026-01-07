"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = void 0;
const fs_1 = __importDefault(require("fs"));
const fs_2 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const paths_1 = require("../utils/paths");
const defaultPhases = [
    { name: 'Priprava', subs: ['Načrtovanje', 'Dovoljenja'] },
    { name: 'Zemeljska dela', subs: ['Izkop', 'Nasipavanje'] },
    { name: 'Temelji', subs: ['Temeljni pasovi', 'Hidroizolacija'] },
    { name: 'Plošča', subs: ['Opaž', 'Betoniranje'] },
    { name: 'Zidava', subs: ['Nosilne stene', 'Predelne stene'] },
    { name: 'Streha', subs: ['Konstrukcija', 'Kritina'] },
    { name: 'Fasada', subs: ['Toplotna izolacija', 'Zaključni sloj'] },
    { name: 'Okna/Vrata', subs: ['Okna', 'Vrata'] },
    { name: 'Instalacije', subs: ['Elektrika', 'Voda', 'Ogrevanje'] },
    { name: 'Estrihi', subs: ['Podlaga', 'Estrih'] },
    { name: 'Zaključna dela', subs: ['Pleskanje', 'Talne obloge'] },
    { name: 'Zunanja ureditev', subs: ['Dovoz', 'Ograja'] },
];
const getInvoiceMonth = (invoiceDate, fallback) => {
    if (fallback)
        return fallback;
    if (!invoiceDate)
        return new Date().toISOString().slice(0, 7);
    if (invoiceDate.length >= 7)
        return invoiceDate.slice(0, 7);
    return new Date(invoiceDate).toISOString().slice(0, 7);
};
class JsonDatabase {
    constructor() {
        this.state = null;
        this.mutex = Promise.resolve();
    }
    async init() {
        if (this.state)
            return;
        await (0, paths_1.ensureDataDirectories)();
        const filePath = (0, paths_1.getDataFilePath)();
        if (fs_1.default.existsSync(filePath)) {
            const raw = await fs_2.promises.readFile(filePath, 'utf-8');
            this.state = JSON.parse(raw);
        }
        else {
            this.state = this.createEmptyState();
            await this.persist();
        }
        this.normalizeState();
        await this.seedPhases();
    }
    createEmptyState() {
        return {
            projects: [],
            phases: [],
            subphases: [],
            contractors: [],
            costs: [],
            documents: [],
            meta: { activeProjectId: null },
        };
    }
    normalizeState() {
        if (!this.state)
            return;
        this.state.projects = this.state.projects.map((p) => ({
            ...p,
            created_at: p.created_at ?? new Date().toISOString(),
            updated_at: p.updated_at ?? p.created_at ?? new Date().toISOString(),
            is_archived: p.is_archived ?? false,
        }));
        this.state.phases = this.state.phases.map((p, idx) => ({
            ...p,
            order_no: p.order_no ?? idx + 1,
            budget_planned: Number(p.budget_planned ?? 0),
        }));
        this.state.subphases = this.state.subphases.map((s, idx) => {
            const main_phase_id = s.main_phase_id ?? s.phase_id ?? '';
            const project_id = s.project_id ?? this.state.phases.find((p) => p.id === main_phase_id)?.project_id;
            return {
                ...s,
                main_phase_id,
                order_no: s.order_no ?? idx + 1,
                project_id,
            };
        });
        this.state.contractors = this.state.contractors.map((c) => ({
            ...c,
            created_at: c.created_at ?? new Date().toISOString(),
            updated_at: c.updated_at ?? c.created_at ?? new Date().toISOString(),
            subphase_ids: Array.from(new Set(c.subphase_ids ??
                (c.subphase_id ? [c.subphase_id] : c.phase_id ? [this.ensureDefaultSubphase(c.phase_id).id] : []))).filter(Boolean),
            is_archived: c.is_archived ?? false,
        }));
        this.state.costs = this.state.costs.map((c) => {
            let subphase_id = c.subphase_id ?? c.podfazaId ?? '';
            const main_phase_id = subphase_id
                ? this.state.subphases.find((s) => s.id === subphase_id)?.main_phase_id ?? c.phase_id ?? c.glavnaFazaId ?? ''
                : c.phase_id ?? c.glavnaFazaId ?? '';
            if (!subphase_id && main_phase_id) {
                subphase_id = this.ensureDefaultSubphase(main_phase_id).id;
            }
            const description = c.description ?? c.opis ?? c.title ?? '';
            const created_at = c.created_at ?? new Date().toISOString();
            const invoice_date = c.invoice_date ?? c.datumRacuna ?? c.date ?? created_at.slice(0, 10);
            return {
                ...c,
                phase_id: main_phase_id ?? '',
                subphase_id,
                contractor_id: c.contractor_id ?? c.izvajalecId ?? '',
                description,
                amount_gross: Number(c.amount_gross ?? c.znesekBruto ?? c.unit_price ?? 0),
                invoice_date,
                invoice_month: getInvoiceMonth(invoice_date, c.invoice_month ?? c.mesecRacuna),
                invoice_no: c.invoice_no ?? c.stevilkaRacuna,
                pdf_attachment: c.pdf_attachment ?? c.pdfAttachment,
                is_archived: c.is_archived ?? c.isArchived ?? false,
                created_at,
                updated_at: c.updated_at ?? created_at,
            };
        });
    }
    async persist() {
        await (0, paths_1.ensureDataDirectories)();
        const filePath = (0, paths_1.getDataFilePath)();
        const tempPath = `${filePath}.tmp`;
        try {
            await fs_2.promises.writeFile(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
            await fs_2.promises.rename(tempPath, filePath);
        }
        catch (error) {
            if (fs_1.default.existsSync(tempPath)) {
                fs_1.default.unlinkSync(tempPath);
            }
            throw new Error(error?.message ?? 'Shranjevanje podatkov ni uspelo');
        }
    }
    async withLock(fn) {
        const release = this.mutex;
        let resolveRelease;
        this.mutex = new Promise((resolve) => {
            resolveRelease = resolve;
        });
        await release;
        try {
            return await fn();
        }
        finally {
            resolveRelease();
        }
    }
    async seedPhases() {
        if (!this.state)
            return;
        if (this.state.phases.length)
            return;
        const phases = [];
        const subphases = [];
        defaultPhases.forEach((phase, idx) => {
            const phaseId = (0, uuid_1.v4)();
            phases.push({ id: phaseId, name: phase.name, order_no: idx + 1, budget_planned: 0 });
            phase.subs.forEach((sub, subIdx) => {
                subphases.push({ id: (0, uuid_1.v4)(), main_phase_id: phaseId, name: sub, order_no: subIdx + 1 });
            });
        });
        this.state.phases = phases;
        this.state.subphases = subphases;
        await this.persist();
    }
    async getActiveProject() {
        await this.init();
        return this.state.meta.activeProjectId;
    }
    async setActiveProject(projectId) {
        await this.init();
        return this.withLock(async () => {
            const exists = this.state.projects.find((p) => p.id === projectId && !p.is_archived);
            if (!exists)
                return null;
            this.state.meta.activeProjectId = projectId;
            await this.persist();
            return projectId;
        });
    }
    async listProjects() {
        await this.init();
        return this.state.projects.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    async createProject(data) {
        await this.init();
        return this.withLock(async () => {
            const now = new Date().toISOString();
            const project = { id: (0, uuid_1.v4)(), created_at: now, updated_at: now, is_archived: false, ...data };
            this.state.projects.push(project);
            if (!this.state.meta.activeProjectId) {
                this.state.meta.activeProjectId = project.id;
            }
            await this.persist();
            return project;
        });
    }
    async updateProject(id, data) {
        await this.init();
        return this.withLock(async () => {
            const idx = this.state.projects.findIndex((p) => p.id === id);
            if (idx === -1)
                return null;
            this.state.projects[idx] = { ...this.state.projects[idx], ...data, updated_at: new Date().toISOString() };
            await this.persist();
            return this.state.projects[idx];
        });
    }
    async deleteProject(id) {
        await this.init();
        return this.withLock(async () => {
            const project = this.state.projects.find((p) => p.id === id);
            if (project) {
                project.is_archived = true;
                project.updated_at = new Date().toISOString();
                if (this.state.meta.activeProjectId === id) {
                    const nextActive = this.state.projects.find((p) => !p.is_archived && p.id !== id);
                    this.state.meta.activeProjectId = nextActive?.id ?? null;
                }
                await this.persist();
            }
        });
    }
    async listPhases() {
        await this.init();
        return [...this.state.phases].sort((a, b) => a.order_no - b.order_no);
    }
    async createPhase(payload) {
        await this.init();
        return this.withLock(async () => {
            const order_no = payload.order_no ?? (this.state.phases.reduce((max, p) => Math.max(max, p.order_no), 0) || 0) + 1;
            const phase = { id: payload.id ?? (0, uuid_1.v4)(), name: payload.name, order_no, budget_planned: 0, project_id: payload.project_id };
            const existing = this.state.phases.find((p) => p.id === phase.id);
            if (existing) {
                existing.name = payload.name;
                existing.order_no = order_no;
                existing.project_id = existing.project_id ?? payload.project_id;
                await this.persist();
                return existing;
            }
            this.state.phases.push(phase);
            await this.persist();
            return phase;
        });
    }
    async updatePhase(id, payload) {
        await this.init();
        return this.withLock(async () => {
            const phase = this.state.phases.find((p) => p.id === id);
            if (!phase)
                return null;
            if (typeof payload === 'string') {
                phase.name = payload;
            }
            else {
                phase.name = payload.name ?? phase.name;
                if (payload.budget_planned !== undefined) {
                    phase.budget_planned = Number(payload.budget_planned);
                }
                if (payload.order_no !== undefined) {
                    phase.order_no = Number(payload.order_no);
                }
            }
            await this.persist();
            return phase;
        });
    }
    async deletePhase(id) {
        await this.init();
        return this.withLock(async () => {
            this.state.phases = this.state.phases.filter((p) => p.id !== id);
            this.state.subphases = this.state.subphases.filter((s) => s.main_phase_id !== id);
            await this.persist();
        });
    }
    async reorderPhases(order) {
        await this.init();
        return this.withLock(async () => {
            order.forEach((phaseId, idx) => {
                const phase = this.state.phases.find((p) => p.id === phaseId);
                if (phase)
                    phase.order_no = idx + 1;
            });
            await this.persist();
            return this.listPhases();
        });
    }
    async listSubphases(phaseId) {
        await this.init();
        const mainPhase = this.state.phases.find((p) => p.id === phaseId);
        const projectId = mainPhase?.project_id;
        return this.state.subphases
            .filter((s) => s.main_phase_id === phaseId && (!projectId || (s.project_id ?? '') === projectId))
            .sort((a, b) => a.order_no - b.order_no);
    }
    async createSubphase(phaseId, payload) {
        await this.init();
        return this.withLock(async () => {
            const mainPhase = this.state.phases.find((p) => p.id === phaseId);
            const mainProjectId = mainPhase?.project_id ?? '';
            const next = payload.order_no ??
                (this.state.subphases
                    .filter((s) => s.main_phase_id === phaseId && (!mainProjectId || (s.project_id ?? '') === mainProjectId))
                    .reduce((max, s) => Math.max(max, s.order_no), 0) || 0) + 1;
            const sub = {
                id: payload.id ?? (0, uuid_1.v4)(),
                main_phase_id: phaseId,
                name: payload.name,
                order_no: next,
                project_id: mainPhase?.project_id,
            };
            const existing = this.state.subphases.find((s) => (s.project_id ?? '') === (mainProjectId ?? '') &&
                (s.id === sub.id || (s.main_phase_id === phaseId && s.name.toLowerCase() === payload.name.toLowerCase())));
            if (existing) {
                existing.name = payload.name;
                existing.order_no = next;
                existing.main_phase_id = phaseId;
                existing.project_id = existing.project_id ?? mainPhase?.project_id;
                await this.persist();
                return existing;
            }
            this.state.subphases.push(sub);
            await this.persist();
            return sub;
        });
    }
    async updateSubphase(id, payload) {
        await this.init();
        return this.withLock(async () => {
            const sub = this.state.subphases.find((s) => s.id === id);
            if (!sub)
                return null;
            sub.name = payload.name ?? sub.name;
            sub.order_no = payload.order_no ?? sub.order_no;
            sub.main_phase_id = payload.main_phase_id ?? sub.main_phase_id;
            if (payload.main_phase_id) {
                const targetPhase = this.state.phases.find((p) => p.id === payload.main_phase_id);
                sub.project_id = targetPhase?.project_id ?? sub.project_id;
            }
            await this.persist();
            return sub;
        });
    }
    async deleteSubphase(id) {
        await this.init();
        return this.withLock(async () => {
            this.state.subphases = this.state.subphases.filter((s) => s.id !== id);
            await this.persist();
        });
    }
    async listContractors(projectId, includeArchived = false) {
        await this.init();
        let contractors = [...this.state.contractors];
        if (projectId) {
            contractors = contractors.filter((c) => !c.project_id || c.project_id === projectId);
        }
        if (!includeArchived) {
            contractors = contractors.filter((c) => !c.is_archived);
        }
        return contractors.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    async createContractor(data) {
        await this.init();
        return this.withLock(async () => {
            if (!data.project_id)
                throw new Error('Projekt je obvezen');
            const project = this.state.projects.find((p) => p.id === data.project_id);
            if (!project || project.is_archived)
                throw new Error('Projekt ne obstaja ali je arhiviran');
            const subphaseIds = Array.from(new Set(data.subphase_ids ?? [])).filter(Boolean);
            if (!subphaseIds.length)
                throw new Error('Vsaj ena podfaza je obvezna');
            subphaseIds.forEach((id) => {
                const sub = this.state.subphases.find((s) => s.id === id);
                if (!sub)
                    throw new Error('Podfaza ne obstaja');
                const main = this.state.phases.find((p) => p.id === sub.main_phase_id);
                if (main?.project_id && main.project_id !== data.project_id) {
                    throw new Error('Podfaza ne pripada projektu');
                }
            });
            const duplicate = this.state.contractors.find((c) => (c.project_id ?? '') === (data.project_id ?? '') &&
                (c.name?.toLowerCase() ?? '') === (data.name?.toLowerCase() ?? '') &&
                !c.is_archived);
            if (duplicate) {
                throw new Error('Izvajalec s tem nazivom že obstaja v projektu.');
            }
            const timestamp = new Date().toISOString();
            const contractor = { id: (0, uuid_1.v4)(), created_at: timestamp, updated_at: timestamp, is_archived: false, ...data, subphase_ids: subphaseIds };
            this.state.contractors.push(contractor);
            await this.persist();
            return contractor;
        });
    }
    async updateContractor(id, data) {
        await this.init();
        return this.withLock(async () => {
            const idx = this.state.contractors.findIndex((c) => c.id === id);
            if (idx === -1)
                return null;
            const nextSubphases = data.subphase_ids ?? this.state.contractors[idx].subphase_ids ?? [];
            const normalizedSubphases = Array.from(new Set(nextSubphases)).filter(Boolean);
            normalizedSubphases.forEach((subId) => {
                const sub = this.state.subphases.find((s) => s.id === subId);
                if (!sub)
                    throw new Error('Podfaza ne obstaja');
                const main = this.state.phases.find((p) => p.id === sub.main_phase_id);
                if ((data.project_id ?? this.state.contractors[idx].project_id) && main?.project_id && main.project_id !== (data.project_id ?? this.state.contractors[idx].project_id)) {
                    throw new Error('Podfaza ne pripada projektu');
                }
            });
            const next = { ...this.state.contractors[idx], ...data, subphase_ids: normalizedSubphases, updated_at: new Date().toISOString() };
            if (!next.project_id)
                throw new Error('Projekt je obvezen');
            const duplicate = this.state.contractors.find((c) => c.id !== id &&
                (c.project_id ?? '') === (next.project_id ?? '') &&
                (c.name?.toLowerCase() ?? '') === (next.name?.toLowerCase() ?? '') &&
                !c.is_archived);
            if (duplicate) {
                throw new Error('Izvajalec s tem nazivom že obstaja v projektu.');
            }
            this.state.contractors[idx] = next;
            await this.persist();
            return next;
        });
    }
    async deleteContractor(id) {
        await this.init();
        return this.withLock(async () => {
            const used = this.state.costs.some((c) => c.contractor_id === id && !c.is_archived);
            if (used) {
                throw new Error('Izvajalec je uporabljen na stroških. Najprej arhivirajte ali posodobite stroške.');
            }
            this.state.contractors = this.state.contractors.filter((c) => c.id !== id);
            await this.persist();
        });
    }
    async archiveContractor(id, archived) {
        await this.init();
        return this.withLock(async () => {
            const contractor = this.state.contractors.find((c) => c.id === id);
            if (!contractor)
                return null;
            contractor.is_archived = archived;
            contractor.updated_at = new Date().toISOString();
            await this.persist();
            return contractor;
        });
    }
    async listCosts(params = {}) {
        await this.init();
        const { sort, page, pageSize, ...filters } = params;
        let costs = [...this.state.costs];
        costs = costs.filter((c) => {
            if (filters.projectId && c.project_id !== filters.projectId)
                return false;
            if (filters.dateFrom && c.invoice_date < filters.dateFrom)
                return false;
            if (filters.dateTo && c.invoice_date > filters.dateTo)
                return false;
            if (filters.phaseId && c.phase_id !== filters.phaseId)
                return false;
            if (filters.contractorId && c.contractor_id !== filters.contractorId)
                return false;
            if (!filters.includeArchived && c.is_archived)
                return false;
            if (filters.search) {
                const haystack = `${c.description ?? ''} ${c.invoice_no ?? ''}`.toLowerCase();
                if (!haystack.includes(filters.search.toLowerCase()))
                    return false;
            }
            return true;
        });
        const sorting = sort ?? { field: 'invoice_date', direction: 'desc' };
        costs.sort((a, b) => {
            const dir = sorting.direction === 'asc' ? 1 : -1;
            switch (sorting.field) {
                case 'amount_gross':
                    return (a.amount_gross - b.amount_gross) * dir;
                case 'phase': {
                    const phaseA = this.state.phases.find((p) => p.id === a.phase_id)?.name ?? '';
                    const phaseB = this.state.phases.find((p) => p.id === b.phase_id)?.name ?? '';
                    return phaseA.localeCompare(phaseB) * dir;
                }
                case 'contractor': {
                    const cA = this.state.contractors.find((c) => c.id === a.contractor_id)?.name ?? '';
                    const cB = this.state.contractors.find((c) => c.id === b.contractor_id)?.name ?? '';
                    return cA.localeCompare(cB) * dir;
                }
                case 'invoice_date':
                default:
                    return (a.invoice_date > b.invoice_date ? 1 : -1) * dir;
            }
        });
        const total = costs.length;
        if (pageSize) {
            const start = ((page ?? 1) - 1) * pageSize;
            costs = costs.slice(start, start + pageSize);
        }
        return { items: costs, total };
    }
    assertRelations(data) {
        if (!this.state)
            return;
        if (data.project_id) {
            const project = this.state.projects.find((p) => p.id === data.project_id);
            if (!project)
                throw new Error('Projekt ne obstaja');
            if (project.is_archived)
                throw new Error('Projekt je arhiviran');
        }
        if (data.phase_id) {
            const hasPhase = this.state.phases.some((p) => p.id === data.phase_id);
            if (!hasPhase)
                throw new Error('Faza ne obstaja');
        }
        if (data.subphase_id) {
            const subphase = this.state.subphases.find((s) => s.id === data.subphase_id);
            if (!subphase)
                throw new Error('Podfaza ne obstaja');
            if (data.phase_id && data.phase_id !== subphase.main_phase_id)
                throw new Error('Podfaza ne pripada izbrani glavni fazi');
        }
        if (data.contractor_id) {
            const contractor = this.state.contractors.find((c) => c.id === data.contractor_id);
            if (!contractor)
                throw new Error('Izvajalec ne obstaja');
            if (contractor.is_archived)
                throw new Error('Izvajalec je arhiviran');
        }
    }
    ensureDefaultSubphase(mainPhaseId) {
        const siblings = this.state.subphases.filter((s) => s.main_phase_id === mainPhaseId);
        let sub = siblings.find((s) => s.name.toLowerCase() === 'neopredeljeno');
        if (!sub) {
            const order_no = (siblings.reduce((max, s) => Math.max(max, s.order_no), 0) || 0) + 1;
            sub = { id: (0, uuid_1.v4)(), main_phase_id: mainPhaseId, name: 'Neopredeljeno', order_no };
            this.state.subphases.push(sub);
        }
        return sub;
    }
    resolvePhasing(data) {
        const providedSubphase = data.subphase_id ? this.state.subphases.find((s) => s.id === data.subphase_id) : undefined;
        if (data.subphase_id && !providedSubphase)
            throw new Error('Podfaza ne obstaja');
        let phase_id = providedSubphase?.main_phase_id ?? data.phase_id ?? '';
        let subphase_id = data.subphase_id;
        if (!subphase_id && phase_id) {
            subphase_id = this.ensureDefaultSubphase(phase_id).id;
        }
        if (!phase_id && providedSubphase) {
            phase_id = providedSubphase.main_phase_id;
        }
        return { phase_id, subphase_id };
    }
    async createCost(data) {
        await this.init();
        return this.withLock(async () => {
            if (!data.project_id)
                throw new Error('Projekt je obvezen');
            if (!data.contractor_id)
                throw new Error('Izvajalec je obvezen');
            const { phase_id, subphase_id } = this.resolvePhasing(data);
            if (!phase_id || !subphase_id)
                throw new Error('Podfaza je obvezna');
            this.assertRelations({ ...data, phase_id, subphase_id });
            const timestamp = new Date().toISOString();
            const description = data.description ?? '';
            const invoice_date = data.invoice_date ?? timestamp.slice(0, 10);
            const invoice_month = getInvoiceMonth(invoice_date, data.invoice_month);
            const amount_gross = Number(data.amount_gross ?? 0);
            const cost = {
                id: (0, uuid_1.v4)(),
                project_id: data.project_id,
                invoice_date,
                invoice_month,
                phase_id,
                subphase_id,
                contractor_id: data.contractor_id,
                description,
                amount_gross,
                invoice_no: data.invoice_no,
                pdf_attachment: data.pdf_attachment,
                is_archived: false,
                created_at: timestamp,
                updated_at: timestamp,
            };
            this.state.costs.push(cost);
            await this.persist();
            return cost;
        });
    }
    async updateCost(id, data) {
        await this.init();
        return this.withLock(async () => {
            const idx = this.state.costs.findIndex((c) => c.id === id);
            if (idx === -1)
                return null;
            const existing = this.state.costs[idx];
            const { phase_id, subphase_id } = this.resolvePhasing({ ...existing, ...data });
            this.assertRelations({ ...data, phase_id, subphase_id });
            const contractor_id = data.contractor_id ?? existing.contractor_id;
            if (!subphase_id)
                throw new Error('Podfaza je obvezna');
            if (!phase_id || !contractor_id)
                throw new Error('Faza in izvajalec sta obvezna');
            const amount_gross = Number(data.amount_gross ?? existing.amount_gross);
            const invoice_date = data.invoice_date ?? existing.invoice_date;
            const invoice_month = getInvoiceMonth(invoice_date, data.invoice_month ?? existing.invoice_month);
            const updated = {
                ...existing,
                ...data,
                phase_id,
                subphase_id,
                contractor_id,
                amount_gross,
                invoice_date,
                invoice_month,
                description: data.description ?? existing.description ?? '',
                updated_at: new Date().toISOString(),
            };
            this.state.costs[idx] = updated;
            await this.persist();
            return updated;
        });
    }
    async deleteCost(id) {
        await this.init();
        return this.withLock(async () => {
            const idx = this.state.costs.findIndex((c) => c.id === id);
            if (idx === -1)
                return;
            const cost = this.state.costs[idx];
            if (!cost.is_archived) {
                this.state.costs[idx] = { ...cost, is_archived: true, updated_at: new Date().toISOString() };
            }
            else {
                this.state.costs.splice(idx, 1);
            }
            await this.persist();
        });
    }
    async setCostArchived(id, archived) {
        await this.init();
        return this.withLock(async () => {
            const cost = this.state.costs.find((c) => c.id === id);
            if (!cost)
                return null;
            cost.is_archived = archived;
            cost.updated_at = new Date().toISOString();
            await this.persist();
            return cost;
        });
    }
    async duplicateCost(id) {
        await this.init();
        return this.withLock(async () => {
            const existing = this.state.costs.find((c) => c.id === id);
            if (!existing)
                return null;
            const timestamp = new Date().toISOString();
            const copy = {
                ...existing,
                id: (0, uuid_1.v4)(),
                created_at: timestamp,
                updated_at: timestamp,
            };
            this.state.costs.push(copy);
            await this.persist();
            return copy;
        });
    }
    async bulkCreateCosts(entries) {
        await this.init();
        const created = [];
        await this.withLock(async () => {
            for (const entry of entries) {
                if (!entry.project_id)
                    throw new Error('Projekt je obvezen');
                if (!entry.contractor_id)
                    throw new Error('Izvajalec je obvezen');
                const { phase_id, subphase_id } = this.resolvePhasing(entry);
                if (!phase_id || !subphase_id)
                    throw new Error('Podfaza je obvezna');
                this.assertRelations({ ...entry, phase_id, subphase_id });
                const timestamp = new Date().toISOString();
                const description = entry.description ?? '';
                const invoice_date = entry.invoice_date ?? timestamp.slice(0, 10);
                const invoice_month = getInvoiceMonth(invoice_date, entry.invoice_month);
                const amount_gross = Number(entry.amount_gross ?? 0);
                const cost = {
                    id: (0, uuid_1.v4)(),
                    project_id: entry.project_id,
                    invoice_date,
                    invoice_month,
                    phase_id,
                    subphase_id,
                    contractor_id: entry.contractor_id,
                    description,
                    amount_gross,
                    invoice_no: entry.invoice_no,
                    pdf_attachment: entry.pdf_attachment,
                    is_archived: false,
                    created_at: timestamp,
                    updated_at: timestamp,
                };
                created.push(cost);
                this.state.costs.push(cost);
            }
            await this.persist();
        });
        return created;
    }
    async attachDocument(doc) {
        await this.init();
        return this.withLock(async () => {
            const record = { id: (0, uuid_1.v4)(), created_at: new Date().toISOString(), ...doc };
            this.state.documents.push(record);
            await this.persist();
            return record;
        });
    }
    async listDocuments(projectId) {
        await this.init();
        return this.state.documents.filter((d) => d.project_id === projectId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    async updateDocument(id, data) {
        await this.init();
        return this.withLock(async () => {
            const idx = this.state.documents.findIndex((d) => d.id === id);
            if (idx === -1)
                return null;
            this.state.documents[idx] = { ...this.state.documents[idx], ...data };
            await this.persist();
            return this.state.documents[idx];
        });
    }
    async replaceDocument(id, filePath) {
        await this.init();
        return this.withLock(async () => {
            const idx = this.state.documents.findIndex((d) => d.id === id);
            if (idx === -1)
                throw new Error('Dokument ne obstaja');
            const oldDoc = this.state.documents[idx];
            // Remove old file if it exists
            if (fs_1.default.existsSync(oldDoc.stored_path)) {
                fs_1.default.unlinkSync(oldDoc.stored_path);
            }
            // Save new file
            const { storedName, targetPath, size } = await this.saveDocumentFile(filePath);
            const updatedDoc = {
                ...oldDoc,
                original_name: path_1.default.basename(filePath),
                stored_name: storedName,
                stored_path: targetPath,
                size,
                mime: 'application/pdf', // Assuming PDF for now as per current logic
            };
            this.state.documents[idx] = updatedDoc;
            await this.persist();
            return updatedDoc;
        });
    }
    async deleteDocument(id) {
        await this.init();
        return this.withLock(async () => {
            const doc = this.state.documents.find((d) => d.id === id);
            if (doc && fs_1.default.existsSync(doc.stored_path)) {
                fs_1.default.unlinkSync(doc.stored_path);
            }
            this.state.documents = this.state.documents.filter((d) => d.id !== id);
            await this.persist();
        });
    }
    async exportCostsCsv(projectId, filters = {}) {
        await this.init();
        const { items } = await this.listCosts({ ...filters, projectId });
        const header = ['invoice_date', 'phase', 'subphase', 'contractor', 'description', 'amount_gross', 'invoice_month', 'invoice_no'];
        const lines = [header.join(',')];
        const formatValue = (value) => {
            if (value === undefined || value === null)
                return '';
            if (typeof value === 'string')
                return `"${value.replace(/"/g, '""')}"`;
            return value;
        };
        items.forEach((c) => {
            const phaseName = this.state.phases.find((p) => p.id === c.phase_id)?.name ?? '';
            const contractorName = this.state.contractors.find((ctr) => ctr.id === c.contractor_id)?.name ?? '';
            const subphaseName = this.state.subphases.find((s) => s.id === c.subphase_id)?.name ?? '';
            const row = [
                c.invoice_date,
                phaseName,
                subphaseName,
                contractorName,
                c.description?.replace(/"/g, '""') ?? '',
                c.amount_gross,
                c.invoice_month,
                c.invoice_no ?? '',
            ].map((v) => formatValue(v));
            lines.push(row.join(','));
        });
        return lines.join('\n');
    }
    async importCostsCsv(csv, projectId) {
        await this.init();
        const [headerLine, ...rows] = csv.split(/\r?\n/).filter(Boolean);
        const headers = headerLine.split(',').map((h) => h.trim());
        const imported = [];
        const pending = [];
        const missingPhases = new Set();
        const missingContractors = new Set();
        rows.forEach((line) => {
            const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
            const entry = {};
            headers.forEach((h, idx) => {
                entry[h] = values[idx];
            });
            const phaseName = entry.phase?.toLowerCase();
            const contractorName = entry.contractor?.toLowerCase();
            const phase = this.state.phases.find((p) => p.name.toLowerCase() === phaseName);
            const contractor = this.state.contractors.find((c) => c.name.toLowerCase() === contractorName);
            if (!phase)
                missingPhases.add(entry.phase || 'Neznana faza');
            if (!contractor)
                missingContractors.add(entry.contractor || 'Neznan izvajalec');
            if (!phase || !contractor)
                return;
            pending.push({
                project_id: projectId,
                invoice_date: entry.date,
                phase_id: phase?.id ?? '',
                subphase_id: '',
                contractor_id: contractor?.id ?? '',
                description: entry.description ?? entry.title ?? '',
                amount_gross: entry.amountGross ? Number(entry.amountGross) : Number(entry.amountNet ?? entry.unitPrice ?? 0),
                invoice_month: entry.invoiceMonth ?? entry.invoice_month,
                invoice_no: entry.invoiceNo ?? '',
                is_archived: false,
            });
        });
        if (missingPhases.size || missingContractors.size) {
            return { created: [], missingPhases: Array.from(missingPhases), missingContractors: Array.from(missingContractors) };
        }
        const created = await this.bulkCreateCosts(pending);
        imported.push(...created);
        return { created: imported, missingPhases: [], missingContractors: [] };
    }
    async importPhasesCsv(csv, projectId) {
        await this.init();
        return this.withLock(async () => {
            if (!projectId) {
                throw new Error('Ni aktivnega projekta');
            }
            const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            if (!lines.length)
                throw new Error('CSV je prazen.');
            const headers = lines[0].split(';').map((h) => h.trim().toLowerCase());
            const expected = ['glavna_faza_id', 'glavna_faza_naziv', 'podfaza_id', 'podfaza_naziv', 'zaporedje'];
            const headerSet = new Set(headers);
            if (headers.length !== expected.length || expected.some((h) => !headerSet.has(h)) || headers.some((h) => !expected.includes(h))) {
                throw new Error(`CSV ni veljaven. Pričakovani stolpci: ${expected.join(';')}`);
            }
            const indices = Object.fromEntries(expected.map((h) => [h, headers.indexOf(h)]));
            const orderHints = new Map();
            const mainPhaseIdHints = new Map();
            const mainPhaseKeys = new Set();
            const subphaseKeys = new Set();
            let validRows = 0;
            const phasesByKey = new Map();
            this.state.phases.forEach((p) => phasesByKey.set(`${p.project_id ?? ''}::${p.id}`, p));
            lines.slice(1).forEach((line, idx) => {
                const cols = line.split(';').map((c) => c.trim());
                const getValue = (field) => cols[indices[field]]?.replace(/^"|"$/g, '') ?? '';
                const phaseIdRaw = getValue('glavna_faza_id');
                const phaseNameRaw = getValue('glavna_faza_naziv');
                const subIdRaw = getValue('podfaza_id');
                const subNameRaw = getValue('podfaza_naziv');
                const orderRaw = getValue('zaporedje');
                if (!phaseIdRaw || !phaseNameRaw) {
                    return;
                }
                validRows += 1;
                const phaseKey = `${projectId}::${phaseIdRaw}`;
                const fallbackPhaseKey = `::${phaseIdRaw}`;
                let phase = phasesByKey.get(phaseKey) ?? phasesByKey.get(fallbackPhaseKey);
                if (!phase) {
                    const nextOrder = (this.state.phases
                        .filter((p) => (p.project_id ?? '') === projectId)
                        .reduce((max, p) => Math.max(max, p.order_no), 0) || 0) + 1;
                    phase = { id: phaseIdRaw, name: phaseNameRaw, order_no: nextOrder, budget_planned: 0, project_id: projectId };
                    this.state.phases.push(phase);
                    phasesByKey.set(phaseKey, phase);
                }
                else {
                    phase.name = phaseNameRaw;
                    phase.project_id = phase.project_id ?? projectId;
                    phasesByKey.set(phaseKey, phase);
                    if (fallbackPhaseKey !== phaseKey) {
                        phasesByKey.delete(fallbackPhaseKey);
                    }
                }
                mainPhaseKeys.add(phaseKey);
                if (!orderHints.has(phaseKey)) {
                    orderHints.set(phaseKey, idx + 1);
                    const numericId = parseInt(phaseIdRaw);
                    if (!isNaN(numericId)) {
                        mainPhaseIdHints.set(phaseKey, numericId);
                    }
                }
                if (!subIdRaw || !subNameRaw)
                    return;
                const parsedOrder = Number(orderRaw);
                const siblings = this.state.subphases.filter((s) => s.main_phase_id === phase.id && ((s.project_id ?? projectId) === projectId));
                const nextOrder = (siblings.reduce((max, s) => Math.max(max, s.order_no), 0) || 0) + 1;
                const order_no = Number.isFinite(parsedOrder) && parsedOrder > 0 ? parsedOrder : nextOrder;
                const subKey = `${projectId}::${subIdRaw}`;
                const existing = this.state.subphases.find((s) => ((s.project_id ?? '') === projectId || !s.project_id) &&
                    (s.id === subIdRaw || (s.main_phase_id === phase.id && s.name.toLowerCase() === subNameRaw.toLowerCase())));
                if (existing) {
                    existing.name = subNameRaw;
                    existing.main_phase_id = phase.id;
                    existing.order_no = order_no;
                    existing.project_id = projectId;
                }
                else {
                    this.state.subphases.push({ id: subIdRaw, main_phase_id: phase.id, name: subNameRaw, order_no, project_id: projectId });
                }
                subphaseKeys.add(subKey);
            });
            if (validRows === 0) {
                throw new Error('CSV ni vseboval veljavnih faz');
            }
            const projectPhases = this.state.phases.filter((p) => (p.project_id ?? '') === projectId);
            const sortedPhases = [...projectPhases].sort((a, b) => {
                const keyA = `${projectId}::${a.id}`;
                const keyB = `${projectId}::${b.id}`;
                const idHintA = mainPhaseIdHints.get(keyA);
                const idHintB = mainPhaseIdHints.get(keyB);
                if (idHintA !== undefined && idHintB !== undefined)
                    return idHintA - idHintB;
                if (idHintA !== undefined)
                    return -1;
                if (idHintB !== undefined)
                    return 1;
                return (orderHints.get(keyA) ?? a.order_no) - (orderHints.get(keyB) ?? b.order_no);
            });
            sortedPhases.forEach((phase, idx) => {
                const key = `${projectId}::${phase.id}`;
                const idHint = mainPhaseIdHints.get(key);
                phase.order_no = idHint !== undefined ? idHint : idx + 1;
            });
            const grouped = this.state.subphases
                .filter((s) => (s.project_id ?? '') === projectId)
                .reduce((acc, sub) => {
                acc[sub.main_phase_id] = acc[sub.main_phase_id] ?? [];
                acc[sub.main_phase_id].push(sub);
                return acc;
            }, {});
            Object.values(grouped).forEach((list) => {
                list
                    .sort((a, b) => a.order_no - b.order_no)
                    .forEach((s, idx) => {
                    s.order_no = idx + 1;
                });
            });
            if (process.env.NODE_ENV !== 'production') {
                console.debug('[phases:importCsv]', {
                    projectId,
                    mainPhases: mainPhaseKeys.size,
                    subphases: subphaseKeys.size,
                });
            }
            await this.persist();
            return { projectId, mainPhases: mainPhaseKeys.size, subphases: subphaseKeys.size, validRows };
        });
    }
    async exportBackup(targetPath) {
        await this.init();
        await this.withLock(async () => {
            await this.persist();
            const uploads = (0, paths_1.getUploadsPath)();
            const archive = require('archiver')('zip');
            const output = fs_1.default.createWriteStream(targetPath);
            const promise = new Promise((resolve, reject) => {
                output.on('close', () => resolve());
                archive.on('error', (err) => reject(err));
            });
            archive.pipe(output);
            archive.file((0, paths_1.getDataFilePath)(), { name: 'data.json' });
            if (fs_1.default.existsSync(uploads)) {
                archive.directory(uploads, 'uploads');
            }
            archive.finalize();
            await promise;
        });
        return targetPath;
    }
    async importBackup(zipPath) {
        await this.withLock(async () => {
            await (0, paths_1.ensureDataDirectories)();
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(zipPath);
            const dataEntry = zip.getEntry('data.json');
            if (dataEntry) {
                const json = dataEntry.getData().toString('utf-8');
                this.state = JSON.parse(json);
            }
            else {
                this.state = this.createEmptyState();
            }
            const uploads = (0, paths_1.getUploadsPath)();
            zip.extractAllTo((0, paths_1.getDataRoot)(), true);
            await this.seedPhases();
            await this.persist();
        });
    }
    async attachPdfToCost(costId, filePath) {
        await this.init();
        return this.withLock(async () => {
            const cost = this.state.costs.find((c) => c.id === costId);
            if (!cost)
                throw new Error('Strošek ne obstaja');
            const meta = await this.saveCostPdf(cost.project_id, filePath);
            cost.pdf_attachment = meta;
            cost.updated_at = new Date().toISOString();
            await this.persist();
            return meta;
        });
    }
    async phasePlanVsActual(projectId) {
        await this.init();
        const { items } = await this.listCosts({ projectId });
        const phases = await this.listPhases();
        return phases.map((p) => ({
            phase_id: p.id,
            phase_name: p.name,
            planned: Number(p.budget_planned ?? 0),
            actual: items.filter((c) => c.phase_id === p.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
        }));
    }
    async saveDocumentFile(sourcePath) {
        await (0, paths_1.ensureDataDirectories)();
        const uploads = (0, paths_1.getUploadsPath)();
        const fileName = path_1.default.basename(sourcePath);
        const storedName = `${Date.now()} -${fileName} `;
        const targetPath = path_1.default.join(uploads, storedName);
        fs_1.default.copyFileSync(sourcePath, targetPath);
        const stats = fs_1.default.statSync(targetPath);
        return { storedName, targetPath, size: stats.size };
    }
    async saveCostPdf(projectId, sourcePath) {
        await (0, paths_1.ensureDataDirectories)();
        const uploadsRoot = (0, paths_1.getUploadsPath)();
        const projectDir = path_1.default.join(uploadsRoot, projectId);
        if (!fs_1.default.existsSync(projectDir)) {
            fs_1.default.mkdirSync(projectDir, { recursive: true });
        }
        const original = path_1.default.basename(sourcePath);
        const storedName = `${Date.now()} -${original} `;
        const targetPath = path_1.default.join(projectDir, storedName);
        fs_1.default.copyFileSync(sourcePath, targetPath);
        return { file_name: storedName, stored_path: targetPath, original_name: original };
    }
}
let instance = null;
const getDb = () => {
    if (!instance)
        instance = new JsonDatabase();
    return instance;
};
exports.getDb = getDb;
