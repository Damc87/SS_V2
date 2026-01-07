import { useMemo, useState } from 'react';
import { Archive, Check, Edit3, FileText, Plus, RefreshCcw, Trash2, UploadCloud, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/EmptyState';
import { useActiveProjectId, useContractors, useCosts, useData, usePhases, useSubphases } from '../../store/useData';
import type { Cost, CostInput, Subphase } from '../../types';
import { formatEUR } from '../../lib/utils';
import { cn } from '../../lib/utils';

type FileWithPath = File & { path?: string };

type CostDraft = {
  phase_id: string;
  subphase_id: string;
  contractor_id: string;
  description: string;
  amount_gross: string;
  invoice_date: string;
  invoice_month: string;
  invoice_no: string;
  pdf?: FileWithPath | null;
};

const today = new Date().toISOString().slice(0, 10);

const deriveMonth = (date: string, existing?: string) => (existing && existing.length >= 4 ? existing : date.slice(0, 7));

export function CostsPage() {
  const navigate = useNavigate();
  const activeProjectId = useActiveProjectId();
  const costs = useCosts();
  const phases = usePhases();
  const subphases = useSubphases();
  const contractors = useContractors();

  const createCost = useData((state) => state.createCost);
  const updateCost = useData((state) => state.updateCost);
  const archiveCost = useData((state) => state.archiveCost);
  const deleteCost = useData((state) => state.deleteCost);
  const attachCostPdf = useData((state) => state.attachCostPdf);

  const projectPhases = useMemo(() => {
    const filtered = phases.filter((p) => !p.project_id || p.project_id === activeProjectId);
    return [...filtered].sort((a, b) => a.order_no - b.order_no);
  }, [phases, activeProjectId]);
  const projectSubphases = useMemo(() => {
    return projectPhases.reduce<Record<string, Subphase[]>>((acc, phase) => {
      acc[phase.id] = [...(subphases[phase.id] ?? [])].sort((a, b) => a.order_no - b.order_no);
      return acc;
    }, {});
  }, [projectPhases, subphases]);
  const projectContractors = useMemo(
    () => contractors.filter((c) => (!c.project_id || c.project_id === activeProjectId) && !c.is_archived),
    [contractors, activeProjectId]
  );
  const projectCosts = useMemo(() => costs.filter((c) => c.project_id === activeProjectId), [costs, activeProjectId]);

  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<CostDraft>({
    phase_id: '',
    subphase_id: '',
    contractor_id: '',
    description: '',
    amount_gross: '',
    invoice_date: today,
    invoice_month: today.slice(0, 7),
    invoice_no: '',
    pdf: null,
  });
  const [editDraft, setEditDraft] = useState<CostDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCosts = useMemo(
    () => projectCosts.filter((c) => (showArchived ? c.is_archived : !c.is_archived)),
    [projectCosts, showArchived]
  );

  const validate = (draft: CostDraft) => {
    const validation: Record<string, string> = {};
    if (!draft.subphase_id) validation.subphase_id = 'Podfaza je obvezna';
    if (!draft.contractor_id) validation.contractor_id = 'Izvajalec je obvezen';
    if (!draft.invoice_date) validation.invoice_date = 'Datum računa je obvezen';
    const amount = Number(draft.amount_gross || 0);
    if (!Number.isFinite(amount) || amount < 0) validation.amount_gross = 'Znesek mora biti ≥ 0';
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const resetNewDraft = () =>
    setNewDraft({
      phase_id: '',
      subphase_id: '',
      contractor_id: '',
      description: '',
      amount_gross: '',
      invoice_date: today,
      invoice_month: today.slice(0, 7),
      invoice_no: '',
      pdf: null,
    });

  const handleAdd = async () => {
    if (!activeProjectId) {
      toast.error('Najprej izberite projekt.');
      return;
    }
    if (!validate(newDraft)) return;
    const amount = Number(newDraft.amount_gross || 0);
    const payload: CostInput = {
      project_id: activeProjectId,
      phase_id: newDraft.phase_id,
      subphase_id: newDraft.subphase_id,
      contractor_id: newDraft.contractor_id,
      description: newDraft.description,
      amount_gross: amount,
      invoice_date: newDraft.invoice_date,
      invoice_month: deriveMonth(newDraft.invoice_date, newDraft.invoice_month),
      invoice_no: newDraft.invoice_no,
      is_archived: false,
    };
    try {
      const created = await createCost(payload);
      const pdfPath = newDraft.pdf?.path;
      if (newDraft.pdf && pdfPath) {
        await attachCostPdf(created.id, pdfPath);
      }
      toast.success('Strošek dodan.');
      resetNewDraft();
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo.');
    }
  };

  const startEdit = (cost: Cost) => {
    setEditingId(cost.id);
    setEditDraft({
      phase_id: cost.phase_id,
      subphase_id: cost.subphase_id,
      contractor_id: cost.contractor_id,
      description: cost.description,
      amount_gross: String(cost.amount_gross ?? ''),
      invoice_date: cost.invoice_date,
      invoice_month: cost.invoice_month,
      invoice_no: cost.invoice_no ?? '',
      pdf: null,
    });
    setErrors({});
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    if (!validate(editDraft)) return;
    const amount = Number(editDraft.amount_gross || 0);
    const payload: Partial<CostInput> = {
      phase_id: editDraft.phase_id,
      subphase_id: editDraft.subphase_id,
      contractor_id: editDraft.contractor_id,
      description: editDraft.description,
      amount_gross: amount,
      invoice_date: editDraft.invoice_date,
      invoice_month: deriveMonth(editDraft.invoice_date, editDraft.invoice_month),
      invoice_no: editDraft.invoice_no,
    };
    try {
      await updateCost(editingId, payload);
      const pdfPath = editDraft.pdf?.path;
      if (editDraft.pdf && pdfPath) {
        await attachCostPdf(editingId, pdfPath);
      }
      toast.success('Strošek posodobljen.');
      setEditingId(null);
      setEditDraft(null);
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Posodobitev ni uspela.');
    }
  };

  const handleArchiveToggle = async (id: string, next: boolean) => {
    try {
      await archiveCost(id, next);
      toast.success(next ? 'Strošek arhiviran.' : 'Strošek obnovljen.');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Sprememba arhiva ni uspela.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Trajno izbrišem strošek? (če ni arhiviran, bo najprej arhiviran)');
    if (!confirmed) return;
    try {
      await deleteCost(id);
      toast.success('Strošek odstranjen.');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspela.');
    }
  };

  const handlePdfOpen = async (cost: Cost) => {
    if (!cost.pdf_attachment?.stored_path) return;
    await window.api.costs.openPdf(cost.pdf_attachment.stored_path);
  };

  const phaseName = (phaseId: string) => projectPhases.find((p) => p.id === phaseId)?.name ?? '—';
  const subphaseName = (phaseId: string, subphaseId: string) =>
    projectSubphases[phaseId]?.find((s) => s.id === subphaseId)?.name ?? '—';
  const contractorName = (id: string) => projectContractors.find((c) => c.id === id)?.name ?? '—';

  const formatMonth = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const m = d.toLocaleDateString('sl-SI', { month: 'short' }).replace('.', '');
    const yy = d.getFullYear().toString().slice(-2);
    return `${m.toUpperCase()} ${yy}`;
  };

  const needsSetup = !projectPhases.length || !projectContractors.length || projectPhases.every((p) => (projectSubphases[p.id] ?? []).length === 0);

  const totalPages = Math.ceil(filteredCosts.length / itemsPerPage);
  const paginatedCosts = filteredCosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (needsSetup) {
    return (
      <EmptyState
        title="Najprej dodajte faze, podfaze in izvajalce"
        description="Za dodajanje stroškov potrebujete glavno fazo s podfazo ter vsaj enega izvajalca."
        icon={<FileText className="h-5 w-5" />}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/faze')}>
              Dodaj faze
            </Button>
            <Button variant="secondary" onClick={() => navigate('/izvajalci')}>
              Dodaj izvajalce
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6 w-full p-4 sm:p-6 sm:pt-2">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Stroški</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 px-4 py-2 rounded-2xl glass-strong border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Prikaži arhiv</span>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {/* NEW COST FORM - AT TOP, COMPACT HEIGHT */}
        <Card className="glass-strong border-white/5 overflow-hidden w-full hover:translate-y-0">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 rounded-lg bg-[#00df82]/10 text-[#00df82]">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Nov strošek</CardTitle>
                <CardDescription className="text-[10px] font-medium uppercase tracking-[0.1em] opacity-60">Hiter vnos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Glavna faza</label>
                <select
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  value={newDraft.phase_id}
                  onChange={(e) => setNewDraft(p => ({ ...p, phase_id: e.target.value, subphase_id: '' }))}
                >
                  <option value="" className="bg-[#0b0f1a]">Izberi fazo</option>
                  {projectPhases.map(phase => (
                    <option key={phase.id} value={phase.id} className="bg-[#0b0f1a]">{phase.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Podfaza</label>
                <select
                  disabled={!newDraft.phase_id}
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold focus:ring-1 focus:ring-primary/40 outline-none transition-all disabled:opacity-50"
                  value={newDraft.subphase_id}
                  onChange={(e) => setNewDraft(p => ({ ...p, subphase_id: e.target.value }))}
                >
                  <option value="" className="bg-[#0b0f1a]">Izberi podfazo</option>
                  {(projectSubphases[newDraft.phase_id] ?? []).map(sub => (
                    <option key={sub.id} value={sub.id} className="bg-[#0b0f1a]">{sub.name}</option>
                  ))}
                </select>
                {errors.subphase_id && <p className="text-[10px] font-bold text-red-500/80 ml-1 mt-1 uppercase tracking-tight">{errors.subphase_id}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Izvajalec</label>
                <select
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  value={newDraft.contractor_id}
                  onChange={(e) => setNewDraft(p => ({ ...p, contractor_id: e.target.value }))}
                >
                  <option value="" className="bg-[#0b0f1a]">Izberi izvajalca</option>
                  {projectContractors.map(ctr => (
                    <option key={ctr.id} value={ctr.id} className="bg-[#0b0f1a]">{ctr.name}</option>
                  ))}
                </select>
                {errors.contractor_id && <p className="text-[10px] font-bold text-red-500/80 ml-1 mt-1 uppercase tracking-tight">{errors.contractor_id}</p>}
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Opis / Opomba</label>
                <Input
                  placeholder="Kaj ste kupili ali katera dela so bila izvedena?"
                  value={newDraft.description}
                  onChange={(e) => setNewDraft(p => ({ ...p, description: e.target.value }))}
                  className="h-10 glass border-white/5 px-4 font-semibold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Znesek (EUR)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  value={newDraft.amount_gross}
                  onChange={(e) => setNewDraft(p => ({ ...p, amount_gross: e.target.value }))}
                  className="h-10 glass border-white/5 px-4 font-bold text-primary"
                />
                {errors.amount_gross && <p className="text-[10px] font-bold text-red-500/80 ml-1 mt-0.5 uppercase tracking-tight">{errors.amount_gross}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Datum računa</label>
                <Input
                  type="date"
                  value={newDraft.invoice_date}
                  onChange={(e) => setNewDraft(p => ({
                    ...p,
                    invoice_date: e.target.value,
                    invoice_month: deriveMonth(e.target.value, p.invoice_month),
                  }))}
                  className="h-10 glass border-white/5 px-4 font-semibold text-sm"
                />
                {errors.invoice_date && <p className="text-[10px] font-bold text-red-500/80 ml-1 mt-0.5 uppercase tracking-tight">{errors.invoice_date}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Št. računa</label>
                <Input
                  placeholder="Npr. 2024-001"
                  value={newDraft.invoice_no}
                  onChange={(e) => setNewDraft(p => ({ ...p, invoice_no: e.target.value }))}
                  className="h-10 glass border-white/5 px-4 font-semibold text-sm"
                />
              </div>

              <div className="flex items-end">
                <label className="group flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 transition-all hover:bg-white/10 hover:border-primary/40">
                  <UploadCloud className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setNewDraft(p => ({ ...p, pdf: e.target.files?.[0] ?? null }))}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground truncate max-w-[150px]">
                    {newDraft.pdf ? newDraft.pdf.name : 'Pripni PDF'}
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-4 items-center">
              <div className="flex-1 bg-[#00df82]/5 border border-[#00df82]/10 rounded-xl p-3 flex gap-4 items-center">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-[#00df82]/20 flex items-center justify-center text-[#00df82]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  <strong className="text-[#00df82]">Nasvet:</strong> Vnosom pripnite PDF račune za boljšo dokumentacijo.
                </p>
              </div>

              <Button
                onClick={handleAdd}
                className="h-12 px-8 text-base font-black bg-[#00df82] hover:bg-[#00c572] text-black shadow-lg transition-all active:scale-[0.98] rounded-xl group min-w-[200px]"
              >
                Dodaj strošek
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* COSTS TABLE - BOTTOM, FULL WIDTH */}
        <Card className="glass-strong border-white/5 overflow-hidden hover:translate-y-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Pregled vseh stroškov</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.1em] opacity-60">
                  {showArchived ? 'Arhivirani zapisi' : ''}
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white/[0.03] border-y border-white/5">
                    {['#', 'Datum', 'Mesec', 'Glavna faza', 'Podfaza', 'Izvajalec', 'Opis', 'Račun', 'Znesek', 'PDF', 'Akcije'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedCosts.map((cost, idx) => {
                    const originalIdx = (currentPage - 1) * itemsPerPage + idx;
                    const isEditing = editingId === cost.id && editDraft;
                    return (
                      <tr key={cost.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-muted-foreground/40 font-bold">{originalIdx + 1}</td>
                        <td className="px-5 py-4 font-medium">
                          {isEditing ? (
                            <Input
                              type="date"
                              className="h-9 w-32 glass border-white/10 text-xs px-2"
                              value={editDraft?.invoice_date ?? ''}
                              onChange={e => setEditDraft(prev => prev ? { ...prev, invoice_date: e.target.value } : prev)}
                            />
                          ) : (
                            cost.invoice_date ? new Date(cost.invoice_date).toLocaleDateString('sl-SI') : '—'
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground font-semibold uppercase tracking-tighter text-[11px]">
                          {formatMonth(isEditing ? editDraft?.invoice_date : cost.invoice_date)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-foreground/80">
                          {isEditing ? (
                            <select
                              className="w-full h-9 rounded-lg border border-white/10 bg-[#0b0f1a] px-2 text-xs"
                              value={editDraft?.phase_id ?? ''}
                              onChange={e => setEditDraft(prev => prev ? { ...prev, phase_id: e.target.value, subphase_id: '' } : prev)}
                            >
                              <option value="">Izberi</option>
                              {projectPhases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          ) : phaseName(cost.phase_id)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {isEditing ? (
                            <select
                              className="w-full h-9 rounded-lg border border-white/10 bg-[#0b0f1a] px-2 text-xs"
                              value={editDraft?.subphase_id ?? ''}
                              onChange={e => setEditDraft(prev => (prev ? { ...prev, subphase_id: e.target.value } : prev))}
                            >
                              <option value="">Izberi</option>
                              {(projectSubphases[editDraft?.phase_id ?? cost.phase_id] ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          ) : subphaseName(cost.phase_id, cost.subphase_id)}
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <select
                              className="w-full h-9 rounded-lg border border-white/10 bg-[#0b0f1a] px-2 text-xs"
                              value={editDraft?.contractor_id ?? ''}
                              onChange={e => setEditDraft(prev => (prev ? { ...prev, contractor_id: e.target.value } : prev))}
                            >
                              <option value="">Izberi</option>
                              {projectContractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          ) : (
                            <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 inline-block text-xs font-bold text-foreground/70">
                              {contractorName(cost.contractor_id)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          {isEditing ? (
                            <Input
                              className="h-9 glass border-white/10 text-xs px-2"
                              value={editDraft?.description ?? ''}
                              onChange={e => setEditDraft(prev => (prev ? { ...prev, description: e.target.value } : prev))}
                            />
                          ) : (
                            <p className="truncate font-medium text-foreground/90">{cost.description || '—'}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground/60 tracking-wider">
                          {isEditing ? (
                            <Input
                              className="h-9 glass border-white/10 text-xs px-2"
                              value={editDraft?.invoice_no ?? ''}
                              onChange={e => setEditDraft(prev => (prev ? { ...prev, invoice_no: e.target.value } : prev))}
                            />
                          ) : cost.invoice_no || '—'}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-foreground">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="h-9 glass border-white/10 text-xs px-2 text-right font-bold w-24"
                              value={editDraft?.amount_gross ?? ''}
                              onChange={e => setEditDraft(prev => (prev ? { ...prev, amount_gross: e.target.value } : prev))}
                            />
                          ) : formatEUR(cost.amount_gross)}
                        </td>
                        <td className="px-5 py-4">
                          {cost.pdf_attachment ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary transition-all" onClick={() => handlePdfOpen(cost)}>
                              <UploadCloud className="h-4 w-4" />
                            </Button>
                          ) : <span className="text-muted-foreground/20">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 items-center">
                            {isEditing ? (
                              <>
                                <Button size="sm" className="h-8 bg-[#00df82] hover:bg-[#00c572] text-black font-bold px-3" onClick={saveEdit}>
                                  <Check className="h-3.5 w-3.5 mr-1" /> OK
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-white/5" onClick={() => setEditingId(null)}>
                                  <Plus className="h-3.5 w-3.5 rotate-45" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5" onClick={() => startEdit(cost)}>
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5" onClick={() => handleArchiveToggle(cost.id, !cost.is_archived)}>
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                                {cost.is_archived && (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500" onClick={() => handleDelete(cost.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredCosts.length && (
                    <tr>
                      <td colSpan={11} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <FileText className="h-10 w-10 mb-2" />
                          <p className="font-bold uppercase tracking-widest text-xs">V tem pogledu ni zapisov</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <p className="text-xs text-muted-foreground font-medium">
                  Stran <span className="text-foreground font-bold">{currentPage}</span> od <span className="text-foreground font-bold">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg border border-white/5 hover:bg-white/5 text-xs font-bold"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Nazaj
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg border border-white/5 hover:bg-white/5 text-xs font-bold"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Naprej
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
