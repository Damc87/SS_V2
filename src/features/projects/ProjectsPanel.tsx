import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useData } from '../../store/useData';

export function ProjectsPanel() {
  const { projects, addProject, setActiveProject } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name) return;
    const project = await addProject({ name, description });
    await setActiveProject(project.id);
    setName('');
    setDescription('');
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardDescription>Projekti</CardDescription>
        <CardTitle>Upravljanje aktivnega projekta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Ime projekta" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Opis" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCreate} disabled={!name} variant="primary" className="shadow-soft">
            Dodaj projekt
          </Button>
          <span className="text-sm text-muted-foreground">Aktivni projekti so dosegljivi tudi v zgornjem izbirniku.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-foreground"
            >
              <ClipboardCheck className="h-4 w-4 text-primary" />
              {p.name}
            </span>
          ))}
          {!projects.length && <span className="text-sm text-muted-foreground">Ni projektov. Dodajte prvega.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
