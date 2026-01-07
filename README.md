# Gradnja – Stroški

Offline-first namizna aplikacija za spremljanje stroškov gradnje. Grajena z Electron + Vite + React + TypeScript + Tailwind + framer-motion + Recharts in lokalnim JSON shranjevanjem (brez Pythona in brez native modulov/node-gyp).

## Windows koraki (developerji)

1. Kloniraj projekt  
   ```bash
   git clone <repo-url>
   cd SS_V1
   ```
2. Namesti odvisnosti  
   ```bash
   npm install
   ```
3. Zaženi razvoj (Vite + Electron, odpre okno)  
   ```bash
   npm run dev
   ```
4. Pripravi produkcijski build rendererja + main procesa  
   ```bash
   npm run build
   ```
5. Ustvari Windows namestitveni EXE prek electron-builder  
   ```bash
   npm run dist
   ```

## Hitri zagon (renderer + Electron)
- Namesti odvisnosti: `npm install`
- Zaženi razvoj: `npm run dev`

## Dodajanje podatkov
- Izvajalci se dodajajo v meniju **Izvajalci** (`/izvajalci`), kjer jih povežete s fazo projekta in jih lahko kasneje uredite ali izbrišete.
- Stroške dodate na strani **Stroški** (`/stroski`); izberete fazo in izvajalca, vnesete opis ter ceno, zapis pa lahko kasneje uredite ali izbrišete.
- Na strani **Faze** lahko celoten šifrant uvozite iz CSV prek gumba **Uvoz CSV**. Pričakovana glava je `glavna_faza_id;glavna_faza_naziv;podfaza_id;podfaza_naziv;zaporedje`. Ob uvozu se glavne faze updat-ajo ali ustvarijo po `glavna_faza_id`, podfaze se vežejo na pripadajočo glavno fazo, duplikati (id + naziv) se preskočijo, ob napaki pa se prikaže jasen opis težave.

### Hiter vodič za stroške
- **Dodaj strošek:** na desnem panelu strani *Stroški* izberi glavno fazo in podfazo, izvajalca ter obvezna polja (znesek, datum). Klikni **Dodaj strošek**.
- **PDF račun:** v istem panelu ali pri inline urejanju priloži en (1) PDF prek gumba *Pripni PDF*. Datoteka se shrani v `uploads/<projectId>/...`, zapis v tabeli dobi gumb **Odpri**.
- **Arhiviranje/obnova:** v tabeli stroškov uporabi ikono arhiva za preklop `isArchived`. V pogledu *Prikaži arhiv* je na voljo tudi **Trajno izbriši**.

## Tema (light/dark)
- Tema se privzeto nastavi glede na sistemski `prefers-color-scheme` in se ob spremembi sistema samodejno posodobi.
- V zgornji orodni vrstici je preklop (System / Light / Dark); izbira se shrani v `localStorage` (`gradnja-theme`), na `<html>` se doda/odstrani razred `dark` (class-based pristop).
- Vsi elementi (sidebar, topbar, kartice, inputi, grafi, tabele, modali) uporabljajo CSS spremenljivke iz `src/styles/index.css`, zato so skladni v obeh temah.
- Leva navigacija ima gumb za skrčenje/razširitev; stanje (collapsed/expanded) se shrani v `localStorage` in se ohrani med zagoni.
- Gumb **Osveži** v zgornji vrstici ponovno naloži projekte, faze, stroške in izvajalce v store brez hard reload-a okna ter pokaže toast “Osveženo”.

## Struktura
- `/electron`: glavni proces, JSON shramba in IPC handlerji
- `/src`: renderer (React + Tailwind + shadcn-style UI, routing)
- `/src/features`: domenske funkcionalnosti (dashboard, projekti, stroški, faze, izvajalci, dokumenti, nastavitve)
- `/src/components`: skupne UI komponente, layout skelet, ErrorBoundary/Loading
- `/src/store`: globalno stanje (zustand)
- `/src/styles`: globalni stili

### Struktura strani
- **Dashboard:** premium “glass” kartice, grafi (stroški po fazah, top izvajalci, kumulativa).
- **Projekti:** upravljanje aktivnega projekta, tabs za pregled/dodajanje in prazno stanje.
- **Faze / Stroški / Izvajalci / Dokumenti / Nastavitve:** usklajeni card layouti, prazna stanja, globalni loader/toaster in ErrorBoundary, da UI nikoli ne ostane bel.

## Podatki & poti (Windows)
- Vsi podatki: `%APPDATA%/GradnjaStroski/data.json`
- Priponke: `%APPDATA%/GradnjaStroski/uploads/`
- Poti se pridobijo prek `app.getPath("userData")` in niso odvisne od Pythona ali native modulov.

### Ponastavi podatke
Z zaprtim programom izbriši datoteko `%APPDATA%/GradnjaStroski/data.json` (po potrebi tudi mapo `uploads`). Ob ponovnem zagonu se shramba znova inicializira z osnovnimi fazami.
