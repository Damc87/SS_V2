import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, FileText, Gauge, Layers, Settings, Users, FileArchive, FolderKanban, ClipboardList } from 'lucide-react';
import { cn } from '../lib/utils';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge, to: '/' },
  { id: 'phase-overview', label: 'Pregled po fazah', icon: ClipboardList, to: '/pregled-po-fazah' },
  { id: 'projects', label: 'Projekti', icon: FolderKanban, to: '/projekti' },
  { id: 'phases', label: 'Faze', icon: Layers, to: '/faze' },
  { id: 'costs', label: 'Stroški', icon: FileText, to: '/stroski' },
  { id: 'contractors', label: 'Izvajalci', icon: Users, to: '/izvajalci' },
  { id: 'documents', label: 'Dokumenti', icon: FileArchive, to: '/dokumenti' },
  { id: 'settings', label: 'Nastavitve', icon: Settings, to: '/nastavitve' },
];

export function Sidebar() {
  return (
    <aside
      className="relative z-20 shrink-0 overflow-hidden border-r border-border/80 bg-[#0b0f1a]/85 backdrop-blur-2xl shadow-[0_22px_80px_-38px_rgba(0,0,0,0.55)] w-[280px]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-card ring-1 ring-border/70">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">Gradnja</div>
            <div className="text-xs text-muted-foreground">SaaS nadzorna plošča</div>
          </div>
        </div>
      </div>
      <div className="mx-4 mb-2 h-px rounded-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />
      <nav className="flex flex-col gap-1 px-3 pb-4" aria-label="Glavna navigacija">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-[1px] hover:bg-white/5',
                isActive
                  ? 'border border-white/20 bg-white/10 text-white shadow-soft'
                  : 'border border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 h-5 w-1 rounded-full bg-[#F4E29C] shadow-[0_0_8px_rgba(244,226,156,0.6)] transition',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  )}
                />
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-300',
                    isActive ? 'text-[#F4E29C] drop-shadow-[0_0_6px_rgba(244,226,156,0.4)]' : 'text-muted-foreground/80'
                  )}
                />
                <span className={cn('truncate transition-colors duration-300', isActive ? 'text-white' : 'text-foreground')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-5 text-xs text-muted-foreground/80">Lokalni način</div>
    </aside>
  );
}
