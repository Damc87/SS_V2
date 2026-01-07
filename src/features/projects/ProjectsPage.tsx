import { useMemo, useState } from 'react';
import {
  FolderPlus,
  MapPin,
  Sparkles,
  Trash2,
  Calendar,
  Maximize2,
  LayoutGrid,
  Info,
  ChevronRight,
  CheckCircle2,
  Clock,
  PlusCircle,
  Eye,
  Building2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../store/useData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { EmptyState } from '../../components/EmptyState';
import { cn } from '../../lib/utils';
import { Project } from '../../types';

const SLOVENIAN_CITIES = [
  'Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo mesto', 'Ptuj',
  'Trbovlje', 'Kamnik', 'Nova Gorica', 'Jesenice', 'Domžale', 'Škofja Loka', 'Izola',
  'Murska Sobota', 'Postojna', 'Logatec', 'Vrhnika', 'Slovenj Gradec'
];

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  'Ljubljana': { x: 37.5, y: 55.6 },
  'Maribor': { x: 70.4, y: 24.4 },
  'Celje': { x: 59.5, y: 44.1 },
  'Kranj': { x: 33.2, y: 43.9 },
  'Velenje': { x: 55.0, y: 32.0 },
  'Koper': { x: 15.0, y: 87.7 },
  'Novo mesto': { x: 56.7, y: 71.7 },
  'Ptuj': { x: 76.0, y: 30.0 },
  'Trbovlje': { x: 53.0, y: 46.0 },
  'Kamnik': { x: 42.0, y: 45.0 },
  'Nova Gorica': { x: 8.0, y: 55.0 },
  'Jesenice': { x: 25.0, y: 28.0 },
  'Domžale': { x: 44.0, y: 48.0 },
  'Škofja Loka': { x: 37.0, y: 45.0 },
  'Izola': { x: 13.0, y: 92.0 },
  'Murska Sobota': { x: 85.4, y: 17.7 },
  'Postojna': { x: 32.0, y: 72.0 },
  'Logatec': { x: 35.0, y: 65.0 },
  'Vrhnika': { x: 38.0, y: 62.0 },
  'Slovenj Gradec': { x: 58.0, y: 22.0 },
};

function SloveniaMap({ projects }: { projects: Project[] }) {
  const pins = useMemo(() => {
    return projects
      .filter(p => p.location && CITY_COORDS[p.location])
      .map(p => ({
        id: p.id,
        name: p.name,
        location: p.location!,
        ...CITY_COORDS[p.location!]
      }));
  }, [projects]);

  return (
    <Card className="glass-strong border-white/5 overflow-hidden relative min-h-[450px] flex items-center justify-center p-6 pb-12">
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none flex items-center justify-center p-12">
        <svg viewBox="0 0 1000 660" className="w-full h-full fill-primary/5 stroke-primary/30 stroke-[2] drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <path d="M954.5 182.4l-6.9-5.6-2.9-1.7-3-0.5-6.3 0.8-2.5-0.3-2.4-1.7-4.9-5.2-2.5-1.7-3.3-0.2-3.7 0.3-3.6-0.5-3.4-2.7-1.8 3.1-0.1-0.1-2-3-1.2 1.3-2.9 3.5-5.6 1.9-4.4 2.8-9.1 3.5-0.9 1-7.5 8.5-0.2 3.5-0.1 2.6 1.1 5.7 3.4 11.6 0.2 3.4-0.5 6.7 0.7 3.5 1.8 2.1 4.9 3.3 1.4 2 0.3 3.6 0.1 1-1.3 1.3-6.6-0.1-10.3 2.6-2.5 0.1-4.8-1.2-4.1-2.4-7-6.6-2.8-1.4-3.5 0.7-2.4 2.6-2.2 3.2-2.8 2.3-3.3 0.6-1.7-0.3-8.8-1.9-0.2 7.5 0.7 6-0.1 5.4-2.1 5.7-0.7 0.8-3.1 3.5-5.7 4-6 3-1.4 0.4-3.4 1-9.6 1.7-8.6 4.8-10.1 5.6-0.8 0-0.5 0-13 0.4-4.6 1.2-4.4 2.1-1 0.8-3 2.3-5.9 9.9-5.5 3.5-20.7-1.5-4.8-0.3-6.2 3.1-3.8 5.2-1.1 1.5-5.4 10.3-4.1 11.8 0 10.5 4 9.3 5.7 6.1 2.3 2.4 3.5 2.1 8.1 3.4 3.5 2.6 2.6 4 1.5 2.2-1.3 4.4-3.4 5.1-2.2 8.4 0.3 8.6 0.5 12.7-0.4 7-1.5 5.1-2 4.9-1.2 5 1.3 5.3 3.4 8.3 0.1 6-2.8 4.1-6 3.1-5.6 1.7-11.2 0.4-10.8-1.9-7.6-1.3-2.8 1.4-5.3 4.5-2.9 1-3.3-0.6-3.3-1.1-3.2-0.3-3.2 1.5-1.4 3.8 1.2 4.4 0.4 3.9-3.2 2.7-0.2 0.1-28.3 9.5-7.9 2.6-11.6 6.5-2.5 2.9-1.4 4-0.3 0.8 0.5 1.7 2.2 1.1 2.7 2.7 2.9 5.6 1.5 2 2.6 1.9 3.7 1.4 1.2-0.8 0.4-1.7 1.3-1.1 3.5-1 1.1-0.5 0.9 0.8 4.7 5.3 0.5 0.7 4.7 7.8 1.6 3.7-6-0.1-4 1.4-3.6 2-8.4 2.7-1.7 3-1.1 3.3-2 1.7-3.6 1.9 0.3 3.4 2.1 4.4 1.6 4.6 0.1 0.4 1.7 10.7 2.4 8.9 4.1 7 14.5 9.9-2.8 2.4-5.1 7.2-2.5 2.4-3.2 0.9-9.4-0.1-16.1 5.9-12 4.5-13-1.8-21.1-18.1-2.9-2.5-14-0.3-2.9-2.7-3.2-1.5-2.6-0.3-4.2-0.6-5-4.7-6.6-4.3-5.2 0.2-1.1 8.8-5.5 9.6-12.4 4.5-12-2.6-4.5-11.5-0.1 0 0-0.1-26.8-11.8-5.7-4.9-0.1-2.1 1-7.3-0.6-3.2-1.6-2.3-0.1 0-1.9-1.1-2-0.9-9.9-7.9-3.7-3.9-2.7-5.2-0.2-5.6 0.3-7.6-0.6-6.3-3.2-1.8-3.4 1.4-1.5 0.7-2.3 2.5-3.6 8.3-3 4.5-7.3 8.2-2.7 3.9-1.8 5.3-0.2 1.8-1.2 9.3-1.5 5.8-3.8 6.9-11.3 8.4-5.4 5-11.1 6.3-13.2 1.2-13.4-2.5-11.5-5.1-6.3-1.6-7.4 2.2-13.8 6.5-7.4 1.3-0.7 0-0.2 0-6.8-0.4-7.6-2.6-7.3-5.3-3.8-3.9-4.1-2.2-7.7-1.6-4.5-1-2 1.4-1 2.9 0 4.4 6.1 7.3-3.7 5.1-13.5 5.8-4.2 4.1-2.5 4-3.1 2.3-15.4-2.3-4.6-1.4-3.8-3.9-13.6-8.7-28.7 1.3-4.9 0.3-5.4-1.4-10-10.7 0.6-1.8-0.7-3.5 1.9-4.2 0-2.6-2.8-0.5-2.2-1.7-1.7-2.7-1.2-3.8 6.1 1.4 24.7-3.7 22.4-3.3 0-2.6-3-4.4-4.3-4.7-4.5-4.9 14.2-1.3 11.4 6.2 13.6-1.4 5.8-7.2 5.5-6.9 2.2-5.4-0.3-0.8-0.1-0.3-2.6-0.2-4.3-2.5-3.1-3.4-23-38.9-20-9-2.8-2.2-11.4-8.9-4.8-1.5-10-1.2-8-4.4-2.1-4.1-2.3-4.6 0.9-14.2 8.7-19.8 2.6-5.9 2-8.1 2.2-8.5-4.9-7.9-1.5 0.4-8.4 2-9.3 4.4-8.6 0.7-7.9-9-0.1-0.5-0.2-0.4-0.2-0.4-0.3-0.4-1.3-1.1-3.8-4.4 4.4-4 1.5-1 2.3-2.9 0.8-2.9-0.8-2.7-2.3-2.5 6.6-8.8 5.1-3.8 27-20.7 8.3-15.3-1.1-4-1.1-3.8-2.9-0.5-3.9-0.8-8.5 0.9-7.3-1.1-8.7-8.7-5.4-3.8-8.1-1.6-4-2.3-8.7-0.6-4.4-1.6 4.2 7.4-7.9 1.2-2.4-3.6-1.1-5.8-3.8-5.2 0-0.1-1.8-10.5-1.6-5-2.2-4.1 7.5-4.8 1.2-2.1 4.1-7.1 3.9-8.8 3.1-3.8 3.8-0.4 3.6-1.8 6.9-5 13.4-7.2 7-7.4 6.2-8.7 7.1-6.7 9.7-1.2 7.2 0.2 5.4-2.9 2.4-5 0.7-1.6 0.4-10.7 1.7-2.2 1-2.6 0.6-3-0.1-3.3 4.4 0.4 19.1 4.6 3.9 0 18.7-3.1 8.7 1.5 26.4 12.5 4.8 0.6 4.6-0.9 5.1-0.9 5.1 0.1 4.7 1.5 4.2 2.1 16.2 14 3.1 0.9 0.6 0.1 26.7 0.8 34.6 1 9.7-2.2 3 0.7 1.4 2 0.9 2.4 1.7 1.9 4.9 2.3 4 1.8 4.8 0.8 10-2.4 3.9 5.5 3.3 7.1 3.8 4 5-2.2 1.3-3.2 1.4-3.7 2.4-8.1 4.3-6.1 2.8-1.2 6.2-0.5 2.9-0.9 3-1.9 5.8-6.1 1.3-0.3 1.7 0.3 2.2 0.3 2-5.1 3.4-4.1 1.4-2.9 1.8-2 4.8-2.1 2.5 1.8 7.4-1.2 6.4-3 1.6-1.4 2.4-5.3 3-7 2.1-6.4 2.2-6.8 3.3-7.1 4.9-7 3.6-1.6 4.1 0.5 4.9-0.6 1-0.2 6.3-4 4.1-2.5 4.1 0.7 5.6 8 10.7-15.3 16.6-5.4 6.9 0.8 5.7 0.6 19.3 2.1 9.4 1 36.9-2 15.9-0.8 8.5 3.2 5.2 4.5 1.3 1.2 6.6 4.1 8.6-1.5 5.4-4.3 0.8-1.7 1-2.4 0.8-4 0.1-0.8 2.9-6 4.4-3.4 6.2-1.6 6.1-0.1 4.4 1.3 3.7-1.1 1.5-1.1 1.5-1.2 1.7-3.6 0-5.4 0.9-6.4 4.6 2.8 22.1 3.3 7.7-0.4 8.5-3.4 11-4.5 8.1-0.7 8 1.6 19.5 9.9 11.8 2.1 3.1 2.2 5.4 6.8 0.1 0-0.7-9.7-3.2-6.5-6.2-3.9-3.3-10.3-0.2-7.4 0.4-6.1 0-1.3 2-13.1-0.2-3-1.3-0.9-0.3-0.9 2.8-3 1.7-1 11.8-2.9 1.1-0.3 6-3.5 11.9-7.1 10.4 2.6 1.5 0.3 12.7-1.1 26.7-2.3 3 1.7 4.4 5.4 1.3 1.7 2.5 1.3 4.2 0.2 1.3 2.2-0.7 3.7-1.6 5.2-2 4.7-1.1 1.9-2.6 4.5-0.7 3.1-0.4 1.6 0.6 1.5 4 12.2 3.3 4.2 2.5 4.8 2.6 3.2 4-0.7 0.1 7.1 2.3 1 0.2 0.1 1.5 0.6 5.4 0.4 4.3 2.9 1.6 7.9-2.3 2.2-1.7 1.7-5.5 2.6-2.6 4.2 1.1 2.8 1.2 3 5.2 4.3 10.3 6.1 10.6 16.7 9.8 8.3 4.1 18.1z" />
        </svg>
      </div>

      <div className="relative w-full h-[400px] max-w-4xl">
        {/* Decorative Map Grid/Dots */}
        <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(12,1fr)] opacity-[0.05]">
          {Array.from({ length: 240 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20" />
          ))}
        </div>

        {/* Legend */}
        <div className="absolute top-6 left-6 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lokacije projektov</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 max-w-[150px]">
            Vizualni pregled gradenj po Sloveniji glede na izbran kraj.
          </p>
        </div>

        {/* Map Dots/Pins */}
        <AnimatePresence>
          {pins.map((pin) => (
            <motion.div
              key={pin.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="absolute group z-10"
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                {/* Ping animation for active projects? Maybe too much. Let's do a simple glow */}
                <div className="h-4 w-4 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)] border-2 border-background cursor-pointer transition-transform group-hover:scale-125" />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 glass-strong rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap translate-y-2 group-hover:translate-y-0">
                  <p className="text-xs font-bold text-foreground">{pin.name}</p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                    <MapPin className="h-2.5 w-2.5" />
                    {pin.location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state hint on map */}
        {pins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-muted-foreground/30">
            <Navigation className="h-10 w-10" />
            <p className="text-sm font-medium">Ni projektov z določeno lokacijo</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ProjectsPage() {
  const { projects, activeProjectId, setActiveProject, addProject, updateProject, deleteProject } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [netM2, setNetM2] = useState('');
  const [location, setLocation] = useState('');
  const [tab, setTab] = useState('overview');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editNetM2, setEditNetM2] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (a.id === activeProjectId) return -1;
      if (b.id === activeProjectId) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [projects, activeProjectId]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      activeProject: projects.find((p) => p.id === activeProjectId),
    };
  }, [projects, activeProjectId]);

  const handleCreate = async () => {
    if (!name) return;
    try {
      const project = await addProject({
        name,
        description,
        location,
        net_m2: netM2 ? parseFloat(netM2) : undefined
      } as any);
      await setActiveProject(project.id);
      setName('');
      setDescription('');
      setNetM2('');
      setLocation('');
      setTab('overview');
    } catch {
      // toast already handled
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditNetM2(project.net_m2?.toString() || '');
    setEditLocation(project.location || '');
  };

  const handleUpdate = async () => {
    if (!editingId || !editName) return;
    try {
      await updateProject(editingId, {
        name: editName,
        description: editDesc,
        location: editLocation,
        net_m2: editNetM2 ? parseFloat(editNetM2) : undefined
      } as any);
      setEditingId(null);
    } catch {
      // toast already handled
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Želite izbrisati projekt? Podatki bodo trajno odstranjeni.');
    if (!confirm) return;
    try {
      await deleteProject(id);
    } catch {
      // toast handled globally
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!projects.length) {
    return (
      <EmptyState
        title="Ni projektov"
        description="Dodajte prvi projekt, da se odklenejo stroški, faze in dokumenti."
        icon={<FolderPlus className="h-5 w-5" />}
        action={
          <div className="flex flex-col gap-2 sm:flex-row items-center">
            <Input
              placeholder="Ime projekta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-64 glass shadow-inner"
            />
            <Button onClick={handleCreate} disabled={!name} className="shadow-lg bg-[#00df82] hover:bg-[#00c572] text-black font-bold">
              Ustvari projekt
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8 w-full p-4 sm:p-8">
      {/* Header with quick stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Upravljanje hiše</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Moji Projekti</h1>
        </div>

        <div className="flex flex-wrap gap-4">
          <Card className="glass-strong min-w-[180px] px-6 py-3 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Vsi projekti</p>
              <p className="text-2xl font-bold leading-tight">{stats.total}</p>
            </div>
          </Card>

          <Card className="glass-strong min-w-[180px] px-6 py-3 flex items-center gap-4 border-success/20">
            <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Aktivni status</p>
              <p className="text-2xl font-bold leading-tight">V teku</p>
            </div>
          </Card>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-px">
          <TabsList className="bg-transparent h-auto p-0 gap-10">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-lg font-semibold transition-all"
            >
              <LayoutGrid className="h-5 w-5 mr-2" />
              Pregled projektov
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-lg font-semibold transition-all"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Novi projekt
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none space-y-8">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {sortedProjects.map((project) => {
                const isActive = project.id === activeProjectId;
                const isEditing = editingId === project.id;

                return (
                  <motion.div
                    key={project.id}
                    variants={item}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <Card className={cn(
                      "relative overflow-hidden transition-all duration-500 h-full border-white/5",
                      "glass-strong shadow-2xl shadow-black/20",
                      isActive ? "neon-border ring-1 ring-primary/20 bg-primary/[0.04]" : "hover:bg-white/[0.03] hover:border-white/10"
                    )}>
                      {/* Active indicator glow */}
                      {isActive && (
                        <div className="absolute -right-20 -top-20 h-48 w-48 bg-primary/15 blur-[80px] pointer-events-none" />
                      )}

                      <CardHeader className="pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 w-full">
                            {isEditing ? (
                              <Input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-xl font-bold bg-white/5 border-primary/40 h-11 px-4 shadow-inner"
                                placeholder="Ime projekta"
                              />
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(project.created_at).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                                  {project.name}
                                </CardTitle>
                              </>
                            )}
                          </div>

                          {isActive && !isEditing && (
                            <div className="flex items-center gap-1.5 rounded-full bg-primary/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary ring-1 ring-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.25)]">
                              <Sparkles className="h-3.5 w-3.5" />
                              Aktivni
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-8 pt-0">
                        {isEditing ? (
                          <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Opis projekta</label>
                              <Input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="bg-white/5 border-border/40 focus:border-primary/50"
                                placeholder="Dodajte kratek opis..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Površina</label>
                                <div className="relative">
                                  <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                  <Input
                                    type="number"
                                    value={editNetM2}
                                    onChange={(e) => setEditNetM2(e.target.value)}
                                    className="pl-10 bg-white/5 border-border/40"
                                    placeholder="m²"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Lokacija</label>
                                <Select value={editLocation} onValueChange={setEditLocation}>
                                  <SelectTrigger className="bg-white/5 border-border/40 h-10">
                                    <SelectValue placeholder="Izberi..." />
                                  </SelectTrigger>
                                  <SelectContent className="glass-strong truncate">
                                    {SLOVENIAN_CITIES.map(city => (
                                      <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button onClick={handleUpdate} className="flex-1 bg-primary text-primary-foreground shadow-xl shadow-primary/20 font-bold">
                                Shrani
                              </Button>
                              <Button variant="ghost" onClick={() => setEditingId(null)} className="flex-1 bg-white/5 hover:bg-white/10">
                                Prekliči
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-4">
                              <div className="mt-1 p-2 rounded-xl bg-white/5 text-muted-foreground/60">
                                <Info className="h-4.5 w-4.5" />
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground italic font-medium">
                                {project.description ? `"${project.description}"` : 'Dodajte opis projekta, da boste lažje zavodili vaše sanje.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:border-primary/20 group-hover:bg-white/10 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
                                  <Maximize2 className="h-3.5 w-3.5" />
                                  <span>Neto površina</span>
                                </div>
                                <p className="text-xl font-bold tracking-tight">{project.net_m2 ? `${project.net_m2} m²` : '—'}</p>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:border-primary/20 group-hover:bg-white/10 transition-all duration-300 text-ellipsis overflow-hidden">
                                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>Lokacija</span>
                                </div>
                                <p className="text-xl font-bold tracking-tight truncate">{project.location || '—'}</p>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 mt-4">
                              <div className="flex gap-2.5">
                                {isActive ? (
                                  <Button size="sm" className="bg-primary/10 text-primary border border-primary/30 cursor-default hover:bg-primary/10 px-4 font-bold shadow-inner">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Aktivni projekt
                                  </Button>
                                ) : (
                                  <Button variant="secondary" size="sm" onClick={() => setActiveProject(project.id)} className="glass-strong hover:bg-white/10 px-4 font-bold border-white/10">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Odpri projekt
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => startEdit(project)} className="hover:bg-white/10 font-bold px-4">
                                  Uredi
                                </Button>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(project.id)}
                                className="h-10 w-10 !text-red-500 hover:text-white hover:bg-red-600 rounded-2xl transition-all shadow-sm"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Slovenia Map Visualization below projects */}
          <SloveniaMap projects={projects} />
        </TabsContent>

        <TabsContent value="add" className="mt-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto"
          >
            <Card className="glass-strong neon-border overflow-hidden shadow-2xl">
              <div className="p-10 space-y-10">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <FolderPlus className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold tracking-tight">Nov gradbeni projekt</h3>
                    <p className="text-muted-foreground text-lg">Zastavite temelje svoje bodoče hiše z vnosom ključnih podatkov.</p>
                  </div>
                </div>

                <div className="grid gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Naslov ali ime projekta <span className="text-primary">*</span>
                    </label>
                    <Input
                      placeholder="npr. Družinska hiša v Trzinu"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass h-14 px-5 text-xl border-border/40 focus:border-primary/50 transition-all font-semibold shadow-inner"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                        Neto bivalna površina (m²)
                      </label>
                      <div className="relative">
                        <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        <Input
                          type="number"
                          placeholder="npr. 145.5"
                          value={netM2}
                          onChange={(e) => setNetM2(e.target.value)}
                          className="glass h-14 pl-12 pr-14 text-xl border-border/40 focus:border-primary/50 font-semibold"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-black">m²</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                        Izberi lokacijo gradnje
                      </label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="glass h-14 pl-5 text-xl border-border/40 focus:border-primary/50 font-semibold">
                          <div className="flex items-center gap-3">
                            <Navigation className="h-5 w-5 text-muted-foreground/30" />
                            <SelectValue placeholder="Izberi kraj..." />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="glass-strong">
                          {SLOVENIAN_CITIES.map(city => (
                            <SelectItem key={city} value={city} className="text-lg py-3">{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Kratek opis projekta / Vizija
                    </label>
                    <Input
                      placeholder="Opišite vaše želje, slog ali ključne značilnosti..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="glass h-14 px-5 border-border/40 focus:border-primary/50 font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-[#00df82]/5 border border-[#00df82]/10 rounded-3xl p-6 flex gap-5 items-center">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#00df82]/20 flex items-center justify-center text-[#00df82] shadow-[0_0_15px_rgba(0,223,130,0.2)]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    <strong className="text-[#00df82]">Strokovni nasvet:</strong> Pravilna površina je ključna za natančno spremljanje stroškov na kvadratni meter skozi celoten proces gradnje.
                  </p>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={!name}
                  className="w-full h-16 text-xl font-black shadow-[0_20px_40px_rgba(0,223,130,0.2)] hover:shadow-[0_25px_50px_rgba(0,223,130,0.3)] transition-all active:scale-[0.97] group bg-[#00df82] hover:bg-[#00c572] text-black"
                >
                  Ustvari projekt in prični z delom
                  <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
