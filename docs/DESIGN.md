# Design-systeem JIP-ATS

Functioneel en verzorgd, in de huisstijl van [Jump Into People](https://jumpintopeople.nl/): **paars, blauw en wit** — paars voor stijl en passie, blauw voor vertrouwen, wit voor helderheid.

> **Let op:** jumpintopeople.nl is vanuit de bouwomgeving niet bereikbaar (netwerkbeleid), dus onderstaand palet is een benadering van paars/blauw/wit. Zodra de exacte hex-codes of het logo beschikbaar zijn, worden alleen de CSS-variabelen hieronder bijgewerkt — de rest van de app volgt automatisch.

## Kleuren

| Token | Waarde (benadering) | Gebruik |
|---|---|---|
| `--primary` | `#5B2D90` (diep paars) | primaire knoppen, actieve navigatie, links |
| `--primary-hover` | `#4A2476` | hover-staat primair |
| `--accent` | `#2E6FD8` (helder blauw) | secundaire accenten, focus-ringen, grafiek-accent |
| `--background` | `#FFFFFF` | paginavlak |
| `--surface` | `#F7F6FB` (paars-getint grijs) | kaarten, zijbalk, tabelkoppen |
| `--border` | `#E5E2EF` | randen, scheidingslijnen |
| `--text` | `#1F1A2E` (bijna-zwart paars) | lopende tekst |
| `--text-muted` | `#6B6580` | secundaire tekst, labels |
| `--success` | `#1E8E5A` | AVG actief, positieve statussen |
| `--warning` | `#C7791B` | AVG verloopt binnenkort, >3 mnd geen contact |
| `--danger` | `#C43D3D` | AVG verlopen, verwijder-acties |

Toegankelijkheid: alle tekst/achtergrond-combinaties minimaal WCAG AA (4,5:1). Paars op wit en wit op paars voldoen; statuskleuren worden altijd gecombineerd met een label of icoon (nooit alleen kleur).

## Typografie

- **Font:** Inter (via `next/font`, self-hosted — geen externe requests)
- Kop 1: 24px semibold · Kop 2: 18px semibold · Body: 14px · Labels/meta: 12,5px
- Cijfers in tabellen en badges: tabular-nums

## Componenten (shadcn/ui als basis)

- **Knoppen:** primair (paars, gevuld), secundair (omlijnd), destructief (rood) — afgeronde hoeken 8px
- **Statusbadges:** AVG-status (groen/oranje/rood) en funnel-fase (kleur van de fase) als subtiele, gevulde pills
- **Tabellen:** compacte rijen, sticky kop, zoekveld + filters erboven; klikbare rij → profiel
- **Kaarten:** wit op `--surface`-achtergrond, 1px rand, zachte schaduw alleen bij hover/drag
- **Formulieren:** labels boven het veld, duidelijke foutmeldingen in het Nederlands, verplichte velden gemarkeerd
- **Lege staten:** korte uitleg + primaire actie (bijv. "Nog geen kandidaten — voeg de eerste toe")

## Schermen

### Layout
Vaste zijbalk links (donker paars vlak, witte iconen + labels): Dashboard · Kandidaten · Vacatures · Contactmomenten · Instellingen. Rechtsboven: notificatie-bel met teller en gebruikersmenu. Content max-breedte 1280px.

### Dashboard
Vier stat-tegels (actieve kandidaten, open vacatures, AVG-acties, contact-reminders) + twee lijsten: "AVG-acties nodig" en "Langer dan 3 maanden geen contact", beide met directe actieknoppen.

### Kandidaten (database, los van vacatures)
Zoekbalk + filters (woonplaats, functie, vacature, status) boven een tabel: naam · woonplaats · huidige functie · laatst gesproken · AVG-badge · gekoppelde vacatures. Rechtsboven de primaire knop **"+ Kandidaat toevoegen"** → formulier in een sheet/modal met secties *Contact* (e-mail verplicht), *Arbeidsvoorwaarden* en *CV-upload* (sleepvlak, PDF/Word). De AVG-toestemming is standaard voor elke kandidaat: die wordt automatisch vastgelegd (365 dagen) en per e-mail beheerd — er is dus geen keuze bij het aanmaken en geen AVG-filter in het overzicht.

### Kandidaatprofiel
Kop: naam, woonplaats, AVG-badge, "laatst gesproken", acties (Bewerken · Contactmoment · Koppel aan vacature · Verleng AVG). Twee kolommen:
- links: contactgegevens, arbeidsvoorwaarden, gekoppelde vacatures (met fase-badge)
- rechts: tabs **CV** (inline PDF-viewer) · **Notities** · **Tijdlijn** (contactmomenten + AVG-gebeurtenissen)

### Vacatures & funnel
Vacaturelijst (titel, bedrijf, locatie, status, aantal kandidaten) → detail = kanban-bord: kolommen zijn de zelf ingestelde fases (kolomkop in de fase-kleur), kaarten tonen naam + woonplaats + laatst gesproken, drag & drop tussen kolommen. Bedrijf en locatie zijn optionele velden bij de vacature.

### Contactmomenten
Overzicht van alle contactmomenten met kandidaten in één tabel: kandidaat (met type-stip, datum/tijd en "Gepland"-badge) · contactgegevens · functie · notitie. Bovenaan één keuze om te sorteren/filteren op periode (laatst gesproken · oudste eerst · afgelopen week · maand · 3 maanden). Klik op een kandidaat → profiel. Een contactmoment maak je hier of vanaf het profiel; het verschijnt op beide plekken.

### Instellingen
- **Funnel-fases:** lijst met sleep-handvatten, naam en kleur bewerkbaar, fase toevoegen/verwijderen (verwijderen alleen als er geen kandidaten in staan, anders eerst verplaatsen)
- **AVG-mail:** één bewerkbare, algemene mailtekst (onderwerp + tekst met plaatshouders `{{naam}}` / `{{einddatum}}`), plus "nu versturen" naar iedereen wiens toestemming binnen 30 dagen verloopt

## Skills bij het bouwen

Bij het uitwerken van de UI worden de skills uit `.agents/skills/` gebruikt: `frontend-design` en `high-end-visual-design` voor de visuele kwaliteit, `ui-ux-pro-max` voor UX-patronen per scherm, `supabase` voor de datalaag.
