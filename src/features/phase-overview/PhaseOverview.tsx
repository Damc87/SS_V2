import { useMemo, useState } from 'react';
import { useData } from '../../store/useData';
import { Card } from '../../components/ui/Card';
import { formatEUR } from '../../lib/utils';
import { Search, ChevronDown, ArrowUpDown } from 'lucide-react';

type SortOrder = 'asc' | 'desc' | 'default';

export const PhaseOverview = () => {
    const { phases, subphases, costs, activeProjectId, projects } = useData();
    const [selectedPhase, setSelectedPhase] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('default');

    const activeProject = useMemo(
        () => projects.find((p) => p.id === activeProjectId),
        [projects, activeProjectId]
    );

    const sortedPhases = useMemo(
        () => [...phases].sort((a, b) => a.order_no - b.order_no),
        [phases]
    );

    // Build grouped data with subtotals
    const groupedData = useMemo(() => {
        if (!activeProjectId) return [];

        const groups: {
            phaseId: number;
            phaseName: string;
            phaseKey: string;
            subphases: { subphaseId: number; subphaseName: string; total: number }[];
            phaseTotal: number;
        }[] = [];

        sortedPhases.forEach((phase) => {
            // Filter by selected phase
            if (selectedPhase !== 'all' && phase.id !== selectedPhase) return;

            const subs = subphases[phase.id] || [];
            const sortedSubs = [...subs].sort((a, b) => a.order_no - b.order_no);

            const subphaseItems: { subphaseId: number; subphaseName: string; total: number }[] = [];

            sortedSubs.forEach((sub) => {
                // Filter by search query
                if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

                const subTotal = costs
                    .filter((c) => c.subphase_id === sub.id && !c.is_archived)
                    .reduce((sum, c) => sum + (c.amount_gross || 0), 0);

                subphaseItems.push({
                    subphaseId: sub.order_no,
                    subphaseName: sub.name,
                    total: subTotal,
                });
            });

            // Sort subphases by amount if requested
            if (sortOrder === 'asc') {
                subphaseItems.sort((a, b) => a.total - b.total);
            } else if (sortOrder === 'desc') {
                subphaseItems.sort((a, b) => b.total - a.total);
            }

            if (subphaseItems.length > 0) {
                const phaseTotal = subphaseItems.reduce((sum, s) => sum + s.total, 0);
                groups.push({
                    phaseId: phase.order_no,
                    phaseName: phase.name,
                    phaseKey: phase.id,
                    subphases: subphaseItems,
                    phaseTotal,
                });
            }
        });

        return groups;
    }, [sortedPhases, subphases, costs, activeProjectId, selectedPhase, searchQuery, sortOrder]);

    const grandTotal = useMemo(
        () => groupedData.reduce((sum, g) => sum + g.phaseTotal, 0),
        [groupedData]
    );

    const toggleSort = () => {
        if (sortOrder === 'default') setSortOrder('desc');
        else if (sortOrder === 'desc') setSortOrder('asc');
        else setSortOrder('default');
    };

    if (!activeProjectId) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card/30 backdrop-blur-sm">
                <div className="text-center">
                    <p className="text-lg font-medium text-muted-foreground">Izberite projekt za pregled po fazah</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Pregled po fazah</h1>
                    <p className="text-muted-foreground mt-1">
                        Podroben prikaz stroškov po posameznih podfazah za projekt{' '}
                        <span className="text-primary font-semibold">{activeProject?.name}</span>
                    </p>
                </div>
                <Card className="px-6 py-4 bg-primary/10 border-primary/20 backdrop-blur-md">
                    <div className="text-sm text-primary/80 font-medium">Skupna poraba</div>
                    <div className="text-2xl font-bold text-primary">{formatEUR(grandTotal)}</div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Išči podfaze..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                </div>

                {/* Phase Filter */}
                <div className="relative">
                    <select
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer min-w-[200px]"
                    >
                        <option value="all" className="bg-[#0b0f1a]">
                            Vse glavne faze
                        </option>
                        {sortedPhases.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#0b0f1a]">
                                {p.order_no}. {p.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Sort Button */}
                <button
                    onClick={toggleSort}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${sortOrder !== 'default'
                            ? 'bg-primary/20 border-primary/40 text-primary'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
                        }`}
                >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === 'asc' ? 'Naraščajoče' : sortOrder === 'desc' ? 'Padajoče' : 'Razvrsti'}
                </button>
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-white/10 bg-[#0b0f1a]/60 backdrop-blur-xl shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 w-24">
                                    Šifra
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Glavna faza
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Podfaza
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Skupni Strošek
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {groupedData.map((group) => (
                                <>
                                    {group.subphases.map((sub, idx) => (
                                        <tr
                                            key={`${group.phaseKey}-${sub.subphaseId}-${idx}`}
                                            className={`group transition-colors duration-150 ${sub.total === 0 ? 'bg-red-500/5' : 'hover:bg-white/[0.03]'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${sub.total === 0
                                                            ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                                                            : 'bg-white/5 text-primary ring-primary/20 group-hover:bg-primary/20'
                                                        }`}
                                                >
                                                    {group.phaseId}.{sub.subphaseId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-white/90">{group.phaseName}</td>
                                            <td
                                                className={`px-6 py-4 text-sm transition-colors ${sub.total === 0 ? 'text-red-400/70' : 'text-muted-foreground group-hover:text-white'
                                                    }`}
                                            >
                                                {sub.subphaseName}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span
                                                    className={`text-sm font-bold ${sub.total > 0 ? 'text-white' : 'text-red-400/60'
                                                        }`}
                                                >
                                                    {formatEUR(sub.total)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Subtotal row for each phase */}
                                    <tr className="bg-primary/5 border-t border-primary/20">
                                        <td className="px-6 py-3" />
                                        <td className="px-6 py-3 text-sm font-bold text-primary" colSpan={2}>
                                            Skupaj: {group.phaseName}
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-bold text-primary">
                                            {formatEUR(group.phaseTotal)}
                                        </td>
                                    </tr>
                                </>
                            ))}
                            {groupedData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Ni podatkov o fazah za ta projekt.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
