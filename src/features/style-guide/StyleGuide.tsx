import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function StyleGuide() {
  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Gumbi</CardDescription>
          <CardTitle>Premium razredi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="primary">Primarni CTA</Button>
          <Button variant="secondary">Sekundarni</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardDescription>Inputi</CardDescription>
          <CardTitle>Polja, ki uporabljajo dvignjeno površino</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Input placeholder="Besedilo" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Številka" type="number" />
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardDescription>Temni način</CardDescription>
          <CardTitle>Teme uporabljajo `.dark` razred</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Barvni tokeni se nahajajo v <code>src/styles/index.css</code> in so povezani s Tailwind razredi (bg-surface, text-foreground, muted, border).</p>
          <p>Dark mode se vklopi, ko element <code>&lt;html&gt;</code> dobi razred <code>dark</code>, uporabniška izbira pa je shranjena v <code>localStorage</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
