import { useMemo } from 'react';
import { RefreshCcw, FolderKanban, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../store/useData';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function Topbar() {
  const { projects, activeProjectId, refreshAll } = useData();

  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId), [projects, activeProjectId]);

  const handleRefresh = async () => {
    await refreshAll();
    toast.success('Osveženo.');
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-[#0b0f1a]/80 backdrop-blur-xl shadow-[0_26px_80px_-50px_rgba(0,0,0,0.8)]">
      <div className="px-6 sm:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-white/4 via-white/2 to-white/5 px-3 py-2 shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee] via-[#22d3ee] to-[#6366f1] text-background shadow-card ring-1 ring-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">Aktivni projekt</p>
              <p className="text-lg font-semibold text-foreground truncate max-w-[200px]">
                {activeProject?.name ?? 'Brez projekta'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-full border border-accent/35 bg-gradient-to-r from-white/6 via-accent/10 to-white/4 px-4 py-2 text-sm font-semibold text-foreground shadow-soft">
              <FolderKanban className="h-4 w-4 text-accent" />
              <span className="truncate max-w-[220px]">{activeProject?.name ?? 'Ni aktivnega projekta'}</span>
            </div>

            <motion.div whileHover={{ y: -1 }}>
              <Button
                variant="secondary"
                size="md"
                className="gap-2 rounded-2xl border border-accent/30 bg-gradient-to-r from-white/5 via-accent/10 to-white/5 text-foreground shadow-soft"
                onClick={handleRefresh}
              >
                <RefreshCcw className="h-4 w-4 text-accent" />
                <span className="hidden sm:inline">Osveži</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
