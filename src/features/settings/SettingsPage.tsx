import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Nastavitve</CardDescription>
          <CardTitle>Valuta, DDV, backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <label className="w-32 text-muted-foreground">Valuta</label>
            <Input className="sm:max-w-[160px]" defaultValue="EUR" />
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <label className="w-32 text-muted-foreground">Privzeti DDV</label>
            <Input className="sm:max-w-[160px]" defaultValue="22" type="number" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="primary" className="shadow-soft">Izvozi backup</Button>
            <Button variant="outline">Uvozi backup</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
