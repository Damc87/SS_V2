import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Shield, Trash2, Edit3, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/EmptyState';
import { useData } from '../../store/useData';
import type { Contractor, Subphase } from '../../types';

type ContractorDraft = {
  name: string;
  subphase_ids: string[];
};

export function ContractorsPage() {
  const navigate = useNavigate();
  const { activeProjectId, contractors, phases, subphases, createContractor, updateContractor, archiveContractor, deleteContractor } = useData();
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
    () => contractors.filter((c) => (!c.project_id || c.project_id === activeProjectId)),
    [contractors, activeProjectId]
  );

  const [filter, setFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [draft, setDraft] = useState<ContractorDraft>({ name: '', subphase_ids: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = projectContractors.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()) && (showArchived || !c.is_archived));

  const resetDraft = () => {
    setDraft({ name: '', subphase_ids: [] });
    setErrors({});
  };

  const startCreate = () => {
    resetDraft();
    setEditing(null);
  };

  const startEdit = (contractor: Contractor) => {
    setEditing(contractor);
    setDraft({ name: contractor.name, subphase_ids: contractor.subphase_ids });
    setErrors({});
  };

  const toggleSubphase = (id: string) => {
    setDraft((prev) => {
      const exists = prev.subphase_ids.includes(id);
      return { ...prev, subphase_ids: exists ? prev.subphase_ids.filter((s) => s !== id) : [...prev.subphase_ids, id] };
    });
  };

  const validate = () => {
    const validation: Record<string, string> = {};
    if (!draft.name.trim()) validation.name = 'Naziv je obvezen';
    if (!draft.subphase_ids.length) validation.subphase_ids = 'Izberite vsaj eno podfazo';
    const duplicate = projectContractors.find(
      (c) => c.id !== editing?.id && c.name.trim().toLowerCase() === draft.name.trim().toLowerCase() && !c.is_archived
    );
    if (duplicate) validation.name = 'Izvajalec s tem nazivom že obstaja';
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleSave = async () => {
    if (!activeProjectId) {
      toast.error('Najprej izberite projekt.');
      return;
    }
    if (!validate()) return;
    try {
      if (editing) {
        await updateContractor(editing.id, { name: draft.name.trim(), subphase_ids: draft.subphase_ids, project_id: activeProjectId });
        toast.success('Izvajalec posodobljen');
      } else {
        await createContractor({ name: draft.name.trim(), subphase_ids: draft.subphase_ids, project_id: activeProjectId });
        toast.success('Izvajalec dodan');
      }
      startCreate();
      setEditing(null);
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo');
    }
  };

  const handleArchiveToggle = async (id: string, archived: boolean) => {
    try {
      await archiveContractor(id, archived);
      toast.success(archived ? 'Izvajalec arhiviran' : 'Izvajalec obnovljen');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Sprememba arhiva ni uspela');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Želite trajno odstraniti izvajalca?')) return;
    try {
      await deleteContractor(id);
      toast.success('Izvajalec odstranjen');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspelo');
    }
  };

  const missingPhases = !projectPhases.length;
  const missingSubphases = projectPhases.every((p) => (projectSubphases[p.id] ?? []).length === 0);

  const resolveSubphaseNames = (ids: string[]) => {
    const flat = Object.entries(projectSubphases).flatMap(([phaseId, subs]) => subs.map((s) => ({ ...s, phaseId })));
    return ids
      .map((id) => {
        const entry = flat.find((s) => s.id === id);
        const phaseName = projectPhases.find((p) => p.id === entry?.phaseId)?.name;
        return entry ? `${phaseName ?? ''} – ${entry.name}` : null;
      })
      .filter(Boolean) as string[];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardDescription>Izvajalci</CardDescription>
          <CardTitle>Večpodfazni izvajalci</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-border" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Prikaži arhiv
          </label>
          <Input className="w-52" placeholder="Išči izvajalca" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>

      {(missingPhases || missingSubphases) && (
        <EmptyState
          title="Najprej dodajte faze in podfaze"
          description="Za dodelitev izvajalcev je potrebna vsaj ena podfaza."
          icon={<Shield className="h-5 w-5" />}
          action={
            <Button variant="secondary" onClick={() => navigate('/faze')}>
              Odpri faze
            </Button>
          }
        />
      )}

      {!missingSubphases && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="glass">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardDescription>Seznam izvajalcev</CardDescription>
                <CardTitle className="text-xl">{showArchived ? 'Arhivirani' : 'Aktivni'}</CardTitle>
              </div>
              <Button variant="primary" className="shadow-soft" onClick={startCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nov izvajalec
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/70 text-muted-foreground">
                    <tr>
                      {['Št.', 'Naziv', 'Dela na', 'Akcije'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((contractor, index) => {
                      const subNames = resolveSubphaseNames(contractor.subphase_ids);
                      return (
                        <tr key={contractor.id} className="border-t border-border/60 hover:bg-muted/50">
                          <td className="px-4 py-3 font-semibold text-foreground/80">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{contractor.name}</td>
                          <td className="px-4 py-3 text-foreground">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{contractor.subphase_ids.length} podfaz</span>
                              <button
                                className="text-xs text-muted-foreground underline underline-offset-4"
                                onClick={() => setExpanded((prev) => (prev === contractor.id ? null : contractor.id))}
                              >
                                {expanded === contractor.id ? 'Skrij' : 'Podrobnosti'}
                              </button>
                            </div>
                            {expanded === contractor.id && (
                              <div className="mt-2 rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground flex flex-col gap-1">
                                {subNames.length ? subNames.map((name) => <span key={name}>• {name}</span>) : <span>Ni podfaz</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(contractor)} title="Uredi">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleArchiveToggle(contractor.id, !contractor.is_archived)} title="Arhiviraj/Obnovi">
                                <Archive className="h-4 w-4" />
                              </Button>
                              {contractor.is_archived && (
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(contractor.id)} title="Trajno izbriši">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filtered.length && (
                      <tr>
                        <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={4}>
                          Ni izvajalcev v tem pogledu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardDescription>{editing ? 'Urejanje izvajalca' : 'Dodaj izvajalca'}</CardDescription>
              <CardTitle>{editing ? editing.name : 'Nov zapis'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-1 text-sm font-semibold text-foreground">
                Naziv
                <Input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Naziv izvajalca" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </label>
              <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/40 p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  <span>Podfaze (multi-select)</span>
                  <span className="text-xs text-muted-foreground">{draft.subphase_ids.length} izbranih</span>
                </div>
                <div className="grid gap-3">
                  {projectPhases.map((phase) => (
                    <div key={phase.id} className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{phase.name}</span>
                        {draft.subphase_ids.some((id) => projectSubphases[phase.id]?.some((s) => s.id === id)) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-2 grid gap-1 md:grid-cols-2">
                        {(projectSubphases[phase.id] ?? []).map((sub) => (
                          <label key={sub.id} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border"
                              checked={draft.subphase_ids.includes(sub.id)}
                              onChange={() => toggleSubphase(sub.id)}
                            />
                            {sub.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.subphase_ids && <p className="text-xs text-destructive">{errors.subphase_ids}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="primary" className="flex-1" onClick={handleSave}>
                  {editing ? 'Posodobi izvajalca' : 'Dodaj izvajalca'}
                </Button>
                {editing && (
                  <Button variant="ghost" onClick={startCreate}>
                    Prekliči
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
