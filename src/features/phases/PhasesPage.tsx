import { useEffect, useMemo, useState } from 'react';
import { Flag, Layers, Download, Plus, Edit3, Trash2, ListTree } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import type { MainPhase, Subphase } from '../../types';

export function PhasesPage() {
  const { phases, subphases, addPhase, updatePhase, deletePhase, addSubphase, updateSubphase, deleteSubphase } = useData();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [subphaseDialogOpen, setSubphaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<MainPhase | null>(null);
  const [editingSubphase, setEditingSubphase] = useState<Subphase | null>(null);
  const [phaseDraft, setPhaseDraft] = useState<{ name: string; order_no: number; budget_planned?: number }>({
    name: '',
    order_no: 1,
    budget_planned: undefined,
  });
  const [subphaseDraft, setSubphaseDraft] = useState<{ name: string; order_no: number }>({
    name: '',
    order_no: 1,
  });


  useEffect(() => {
    if (!phases.length) {
      setSelectedPhaseId(null);
      return;
    }
    setSelectedPhaseId((prev) => (prev && phases.some((p) => p.id === prev) ? prev : phases[0]?.id ?? null));
  }, [phases]);

  const sortedPhases = useMemo(() => [...phases].sort((a, b) => a.order_no - b.order_no), [phases]);
  const selectedSubphases = useMemo(
    () => (selectedPhaseId ? [...(subphases[selectedPhaseId] ?? [])].sort((a, b) => a.order_no - b.order_no) : []),
    [selectedPhaseId, subphases]
  );
  const selectedPhase = sortedPhases.find((p) => p.id === selectedPhaseId) ?? null;

  const openPhaseDialog = (phase?: MainPhase) => {
    if (phase) {
      setEditingPhase(phase);
      setPhaseDraft({ name: phase.name, order_no: phase.order_no, budget_planned: phase.budget_planned });
    } else {
      setEditingPhase(null);
      setPhaseDraft({ name: '', order_no: (sortedPhases.at(-1)?.order_no ?? 0) + 1, budget_planned: undefined });
    }
    setPhaseDialogOpen(true);
  };

  const openSubphaseDialog = (sub?: Subphase) => {
    if (sub) {
      setEditingSubphase(sub);
      setSubphaseDraft({ name: sub.name, order_no: sub.order_no });
    } else {
      setEditingSubphase(null);
      const nextOrder = (selectedSubphases.at(-1)?.order_no ?? 0) + 1;
      setSubphaseDraft({ name: '', order_no: nextOrder });
    }
    setSubphaseDialogOpen(true);
  };

  const handleSavePhase = async () => {
    if (!phaseDraft.name.trim()) {
      toast.error('Naziv glavne faze je obvezen.');
      return;
    }
    try {
      if (editingPhase) {
        await updatePhase(editingPhase.id, { ...phaseDraft, name: phaseDraft.name.trim() });
        toast.success('Glavna faza posodobljena');
      } else {
        await addPhase({ ...phaseDraft, name: phaseDraft.name.trim() });
        toast.success('Glavna faza dodana');
      }
      setPhaseDialogOpen(false);
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo');
    }
  };

  const handleSaveSubphase = async () => {
    if (!selectedPhaseId) {
      toast.error('Najprej izberite glavno fazo.');
      return;
    }
    if (!subphaseDraft.name.trim()) {
      toast.error('Naziv podfaze je obvezen.');
      return;
    }
    try {
      const newOrderNo = subphaseDraft.order_no;

      if (editingSubphase) {
        const oldOrderNo = editingSubphase.order_no;

        // If order_no changed, we need to shift other subphases
        if (oldOrderNo !== newOrderNo) {
          const currentSubs = selectedSubphases.filter(s => s.id !== editingSubphase.id);

          // Check if there's a conflict
          const conflicting = currentSubs.filter(s => s.order_no >= newOrderNo);

          if (conflicting.length > 0) {
            // Shift all subphases with order_no >= newOrderNo up by 1
            for (const sub of conflicting) {
              await updateSubphase(sub.id, { order_no: sub.order_no + 1 });
            }
          }
        }

        await updateSubphase(editingSubphase.id, { ...subphaseDraft, name: subphaseDraft.name.trim(), main_phase_id: selectedPhaseId });
        toast.success('Podfaza posodobljena');
      } else {
        // For new subphases, also check for conflicts
        const conflicting = selectedSubphases.filter(s => s.order_no >= newOrderNo);

        if (conflicting.length > 0) {
          // Shift all subphases with order_no >= newOrderNo up by 1
          for (const sub of conflicting) {
            await updateSubphase(sub.id, { order_no: sub.order_no + 1 });
          }
        }

        await addSubphase(selectedPhaseId, { ...subphaseDraft, name: subphaseDraft.name.trim() });
        toast.success('Podfaza dodana');
      }
      setSubphaseDialogOpen(false);
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo');
    }
  };

  const handleDeletePhase = async (id: string) => {
    if (!window.confirm('Želite izbrisati glavno fazo in vse njene podfaze?')) return;
    try {
      await deletePhase(id);
      toast.success('Faza izbrisana');
      setSelectedPhaseId((prev) => (prev === id ? phases.find((p) => p.id !== id)?.id ?? null : prev));
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspelo');
    }
  };

  const handleDeleteSubphase = async (id: string) => {
    if (!window.confirm('Želite izbrisati podfazo?')) return;
    try {
      await deleteSubphase(id);
      toast.success('Podfaza izbrisana');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspelo');
    }
  };

  const handleExportPhases = () => {
    try {
      // Build CSV content with BOM for Excel UTF-8 support
      const BOM = '\uFEFF';
      const headers = ['Glavna faza ID', 'Glavna faza naziv', 'Podfaza ID', 'Podfaza naziv'];
      const rows: string[][] = [];

      sortedPhases.forEach(phase => {
        const phaseSubs = subphases[phase.id] || [];
        const sortedSubs = [...phaseSubs].sort((a, b) => a.order_no - b.order_no);

        if (sortedSubs.length === 0) {
          // Phase without subphases
          rows.push([String(phase.order_no), phase.name, '', '']);
        } else {
          sortedSubs.forEach(sub => {
            rows.push([
              String(phase.order_no),
              phase.name,
              `${phase.order_no}.${sub.order_no}`,
              sub.name
            ]);
          });
        }
      });

      const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gradbene-faze-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Faze izvožene v datoteko CSV');
    } catch (error) {
      toast.error('Izvoz faz ni uspel');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardDescription>Faze</CardDescription>
            <CardTitle>Šifrant gradbenih faz in podfaz</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleExportPhases} className="shadow-soft">
              <Download className="mr-2 h-4 w-4" />
              Izvoz v Excel
            </Button>
            <Button variant="primary" onClick={() => openPhaseDialog()} className="shadow-soft">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj glavno fazo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sortedPhases.length ? (
            <EmptyState title="Ni faz" description="Dodajte novo fazo, da lahko sledite stroškom." icon={<Flag className="h-5 w-5" />} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    Glavne faze
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => openPhaseDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj
                  </Button>
                </div>
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface/90 shadow-inner">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/70 text-muted-foreground">
                      <tr>
                        {['Zap.', 'Naziv', 'Podfaz'].map((header) => (
                          <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                            {header}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPhases.map((phase) => (
                        <tr
                          key={phase.id}
                          className={`border-t border-border/50 ${selectedPhaseId === phase.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedPhaseId(phase.id)}
                        >
                          <td className="px-4 py-3 font-semibold text-foreground/80">{phase.order_no}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{phase.name}</td>
                          <td className="px-4 py-3 text-foreground">{subphases[phase.id]?.length ?? 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openPhaseDialog(phase)} title="Uredi">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePhase(phase.id)} title="Izbriši">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <ListTree className="h-4 w-4" />
                    Podfaze {selectedPhase ? `• ${selectedPhase.name}` : ''}
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => openSubphaseDialog()} disabled={!selectedPhaseId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj
                  </Button>
                </div>
                {!selectedSubphases.length ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {selectedPhase ? 'Dodajte podfaze za izbrano glavno fazo.' : 'Izberite glavno fazo, da vidite podfaze.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface/90 shadow-inner">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/70 text-muted-foreground">
                        <tr>
                          {['Šifra', 'Naziv'].map((header) => (
                            <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                              {header}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSubphases.map((sub) => (
                          <tr key={sub.id} className="border-t border-border/50 hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary ring-1 ring-inset ring-primary/20">
                                {selectedPhase?.order_no}.{sub.order_no}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-foreground">{sub.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openSubphaseDialog(sub)} title="Uredi">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteSubphase(sub.id)} title="Izbriši">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={phaseDialogOpen} onOpenChange={setPhaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPhase ? 'Uredi glavno fazo' : 'Nova glavna faza'}</DialogTitle>
            <DialogDescription>Uredite naziv, vrstni red in (po želji) planirani proračun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Naziv
              <Input
                value={phaseDraft.name}
                onChange={(e) => setPhaseDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Naziv faze"
                autoFocus
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold text-foreground">
                Zaporedje
                <Input
                  type="number"
                  min={1}
                  value={phaseDraft.order_no}
                  onChange={(e) => setPhaseDraft((prev) => ({ ...prev, order_no: Number(e.target.value) }))}
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-foreground">
                Plan (EUR)
                <Input
                  type="number"
                  min={0}
                  step="100"
                  value={phaseDraft.budget_planned ?? ''}
                  onChange={(e) =>
                    setPhaseDraft((prev) => ({ ...prev, budget_planned: e.target.value === '' ? undefined : Number(e.target.value) }))
                  }
                  placeholder="neobvezno"
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPhaseDialogOpen(false)}>
              Prekliči
            </Button>
            <Button variant="primary" onClick={handleSavePhase}>
              Shrani
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subphaseDialogOpen} onOpenChange={setSubphaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubphase ? 'Uredi podfazo' : 'Nova podfaza'}</DialogTitle>
            <DialogDescription>
              {editingSubphase
                ? 'Podfaza mora imeti naziv in zaporedje v okviru glavne faze.'
                : selectedPhase
                  ? `Dodajanje podfaze za glavno fazo ${selectedPhase.order_no}. ${selectedPhase.name}. Predlagani ID: ${selectedPhase.order_no}.${subphaseDraft.order_no}`
                  : 'Podfaza mora imeti naziv in zaporedje v okviru glavne faze.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Naziv
              <Input
                value={subphaseDraft.name}
                onChange={(e) => setSubphaseDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Naziv podfaze"
                autoFocus
              />
            </label>
            <label className="space-y-1 text-sm font-semibold text-foreground">
              <div className="flex items-center justify-between">
                <span>ID podfaze</span>
                {selectedPhase && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Celotni ID: {selectedPhase.order_no}.{subphaseDraft.order_no}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedPhase && (
                  <span className="text-lg font-bold text-primary">{selectedPhase.order_no}.</span>
                )}
                <Input
                  type="number"
                  min={1}
                  value={subphaseDraft.order_no}
                  onChange={(e) => setSubphaseDraft((prev) => ({ ...prev, order_no: Number(e.target.value) }))}
                  placeholder="npr. 5"
                  className="flex-1"
                />
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSubphaseDialogOpen(false)}>
              Prekliči
            </Button>
            <Button variant="primary" onClick={handleSaveSubphase} disabled={!selectedPhaseId}>
              Shrani
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
