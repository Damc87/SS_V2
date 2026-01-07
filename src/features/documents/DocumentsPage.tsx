import { useRef, useState } from 'react';
import { Inbox, Upload, MoreHorizontal, FileText, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useData } from '../../store/useData';
import { toast } from 'sonner';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';

export function DocumentsPage() {
  const { documents, activeProjectId, refreshDocuments } = useData();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const openDoc = async (path: string) => {
    await window.api.documents.open(path);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !activeProjectId) return;
    const file = files[0] as File & { path?: string };
    try {
      const filePath = file.path;
      if (!filePath) {
        toast.error('Pot do datoteke ni na voljo.');
        return;
      }
      await window.api.documents.attach({
        projectId: activeProjectId,
        filePath,
      });
      await refreshDocuments(activeProjectId);
      toast.success('Dokument shranjen v lokalno mapo.');
    } catch (error) {
      console.error(error);
      toast.error('Nalaganje dokumenta ni uspelo.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta dokument?')) return;
    try {
      await window.api.documents.remove(id);
      if (activeProjectId) await refreshDocuments(activeProjectId);
      toast.success('Dokument izbrisan.');
    } catch (error) {
      console.error(error);
      toast.error('Brisanje ni uspelo.');
    }
  };

  const startEdit = (doc: any) => {
    setEditingId(doc.id);
    setEditName(doc.original_name);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await window.api.documents.update(editingId, { original_name: editName });
      if (activeProjectId) await refreshDocuments(activeProjectId);
      toast.success('Dokument posodobljen.');
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error('Posodobitev ni uspela.');
    }
  };

  const startReplace = (id: string) => {
    setReplacingId(id);
    replaceInputRef.current?.click();
  };

  const handleReplace = async (files: FileList | null) => {
    if (!files?.length || !replacingId) return;
    const file = files[0] as File & { path?: string };
    try {
      const filePath = file.path;
      if (!filePath) {
        toast.error('Pot do datoteke ni na voljo.');
        return;
      }
      await window.api.documents.replace(replacingId, filePath);
      if (activeProjectId) await refreshDocuments(activeProjectId);
      toast.success('Dokument zamenjan.');
    } catch (error) {
      console.error(error);
      toast.error('Zamenjava ni uspela.');
    } finally {
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Dokumenti</CardDescription>
          <CardTitle>Priloženi PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col items-start justify-between gap-2 pb-2 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">Shranjeno v: userData/uploads</div>
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handleUpload(e.target.files)} />
              <input ref={replaceInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handleReplace(e.target.files)} />
              <Button
                variant="primary"
                size="md"
                className="gap-2 shadow-soft"
                onClick={() => inputRef.current?.click()}
                disabled={!activeProjectId}
              >
                <Upload className="h-4 w-4" />
                Naloži PDF
              </Button>
            </div>
          </div>
          {!documents.length ? (
            <EmptyState title="Ni dokumentov" description="Pripnite PDF k aktivnemu projektu." icon={<Inbox className="h-5 w-5" />} />
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="group flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-medium">{d.original_name}</div>
                      <div className="text-xs text-muted-foreground">{(d.size / 1024).toFixed(1)} kB • {new Date(d.created_at).toLocaleDateString('sl-SI')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void openDoc(d.stored_path)}>
                      Odpri
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(d)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Preimenuj
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startReplace(d.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Zamenjaj
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Izbriši
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preimenuj dokument</DialogTitle>
            <DialogDescription>Vnesite novo ime za dokument.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ime dokumenta" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Prekliči</Button>
            <Button onClick={handleUpdate}>Shrani</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
