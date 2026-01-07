# Design tokens (UI/UX)

Premium tema uporablja CSS spremenljivke definirane v `src/styles/index.css`. Tokeni so v RGB obliki, Tailwind razredi (`bg-*`, `text-*`, `border-*`) so vezani na iste spremenljivke, zato barve delujejo enako v light in dark načinu. Tema se preklaplja z razredom `.dark` na elementu `<html>`.

## Barve
| Token | Namen | Light | Dark |
| --- | --- | --- | --- |
| `--bg` | Glavno ozadje | `244 246 250` | `10 14 24` |
| `--surface` | Primarne površine/kartice | `255 255 255` | `16 22 36` |
| `--surface2` | Dvignjene površine/inputi | `240 244 250` | `21 29 46` |
| `--muted` | Subtilna ozadja tabel/sekcij | `232 237 245` | `28 38 58` |
| `--border` | Robovi, delilniki | `221 229 240` | `41 52 73` |
| `--text` | Primarno besedilo | `16 24 40` | `231 233 238` |
| `--text2` | Sekundarno besedilo | `102 112 133` | `158 167 187` |
| `--accent` | Glavni poudarek (CTA, grafi) | `103 125 255` | `132 161 255` |
| `--accent2` | Mehkejši poudarek / gradient | `157 176 255` | `170 188 255` |
| `--success` | Pozitivna stanja | `52 211 153` | `74 222 128` |
| `--warn` | Opozorila | `250 204 21` | `251 191 36` |
| `--danger` | Napake | `248 113 113` | `248 113 113` |
| `--focus-ring` | Enoten fokus | `color-mix(in srgb, rgb(var(--accent)) 38%, transparent)` | `color-mix(in srgb, rgb(var(--accent)) 45%, transparent)` |
| `--shadow` | Mehka globalna senca | `0 28px 90px -48px rgba(15, 23, 42, 0.48)` | `0 26px 120px -48px rgba(0, 0, 0, 0.7)` |

## Tipografija in spacing
- Pisava: **Inter**, z glajenjem `-webkit-font-smoothing: antialiased`.
- Zaoblitve: 12–16 px (`rounded-2xl`, `rounded-3xl`), skladno z `tailwind.config.ts`.
- Whitespace: kartice in sekcije uporabljajo `p-6` ali `p-8`; mreže imajo `gap-4`–`gap-6`.
- Fokus: `focus-visible:ring-[var(--focus-ring)]` + `ring-offset-surface` za kontrast v obeh temah.

## Uporaba v komponentah
- Površine: `bg-surface` za kartice, `bg-elevated` za inpute, `bg-muted` za tabelne headerje.
- Besedilo: `text-foreground` za primarno, `text-muted-foreground` za sekundarno.
- CTA: `bg-gradient-to-r from-primary to-primary-soft` ali `bg-primary/10` za poudarjene badge.
- Sence: uporabljajte `shadow-soft` na gumbih/karticah ter `shadow-card` za hover stanja.
- Dark mode: preklop v TopBar doda/odstrani `.dark` razred in nastavi `localStorage` ključ `gradnja-theme`.
