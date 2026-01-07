import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../store/useData';
import type { CostStatus, PhaseCategory } from '../../types';

const defaultVat = 22;

export function CostModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId?: string | null }) {
  const { phases, contractors, addCost } = useData();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [phaseId, setPhaseId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [amountNet, setAmountNet] = useState(0);
  const [vatRate, setVatRate] = useState(defaultVat);
  const [status, setStatus] = useState<CostStatus>('planirano');
  const [category, setCategory] = useState<PhaseCategory>('material');

  const amountGross = useMemo(() => Number((amountNet * (1 + vatRate / 100)).toFixed(2)), [amountNet, vatRate]);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setPhaseId('');
      setContractorId('');
      setAmountNet(0);
      setVatRate(defaultVat);
      setStatus('planirano');
      setCategory('material');
    }
  }, [open]);

  const handleSave = async () => {
    if (!projectId || !title) return;
    await addCost({
      project_id: projectId,
      date,
      phase_id: phaseId || undefined,
      subphase_id: undefined,
      contractor_id: contractorId || undefined,
      title,
      category,
      amount_net: amountNet,
      vat_rate: vatRate,
      amount_gross: amountGross,
      status,
      invoice_no: '',
      invoice_date: '',
      due_date: '',
      notes: '',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="bg-white rounded-2xl shadow-card w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Nov strošek</div>
                <div className="text-lg font-semibold">Dodaj v projekt</div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Zapri</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-slate-600 space-y-1">
                Naziv
                <input className="w-full rounded-xl border border-border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                Datum
                <input type="date" className="w-full rounded-xl border border-border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                Faza
                <select className="w-full rounded-xl border border-border px-3 py-2" value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
                  <option value="">Ni izbrano</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                Izvajalec
                <select className="w-full rounded-xl border border-border px-3 py-2" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
                  <option value="">Brez</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                Neto znesek
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-border px-3 py-2"
                  value={amountNet}
                  onChange={(e) => setAmountNet(Number(e.target.value))}
                />
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                DDV %
                <input
                  type="number"
                  className="w-full rounded-xl border border-border px-3 py-2"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                />
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                Status
                <select className="w-full rounded-xl border border-border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as CostStatus)}>
                  <option value="planirano">Planirano</option>
                  <option value="potrjeno">Potrjeno</option>
                  <option value="placano">Plačano</option>
                </select>
              </label>
              <label className="text-sm text-slate-600 space-y-1">
                Kategorija
                <select className="w-full rounded-xl border border-border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value as PhaseCategory)}>
                  <option value="material">Material</option>
                  <option value="delo">Delo</option>
                  <option value="stroj">Stroj</option>
                  <option value="prevoz">Prevoz</option>
                  <option value="ostalo">Ostalo</option>
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between bg-muted rounded-xl p-3 text-sm text-slate-700">
              <div>
                Bruto znesek: <strong>{amountGross.toFixed(2)} €</strong>
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft" onClick={handleSave} disabled={!title || !projectId}>
                Shrani
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
