# Bouwplan JIP-ATS

## Doel

Een basis-ATS voor Jump Into People: de kernfuncties van systemen als Loxo en Recruitee (kandidaten, funnel, vacatures, AVG), zonder de extra's die zulke pakketten zwaar en duur maken. Eenvoudig te hosten, schaalbaar waar het moet (database en opslag bij Supabase), en met een nette Nederlandstalige interface in de huisstijl van Jump Into People.

## Uitgangspunten

- **Basis, geen alles-kunner** — elke functie hieronder is bewust gekozen; nieuwe ideeën gaan eerst naar de "Later misschien"-lijst.
- **AVG standaard aan** — toestemmingsbeheer is geen optie maar ingebakken gedrag (zie [ARCHITECTUUR.md](ARCHITECTUUR.md#avg-automatisering)).
- **Handmatige invoer** — kandidaten worden via een formulier toegevoegd. CV's worden geüpload en zijn inline te bekijken in het profiel; er is géén automatische CV-parsing.
- **Elke fase levert iets werkends op** — na iedere fase is de app te gebruiken en te beoordelen.

## Fasering

### Fase 1 — Fundament
**Resultaat: een draaiende app waarop je kunt inloggen, in de juiste huisstijl.**

- Next.js 15-project (App Router, TypeScript) + Tailwind CSS + shadcn/ui
- Supabase-project koppelen: Auth (e-mail + wachtwoord voor recruiters), eerste migraties
- Design-systeem opzetten volgens [DESIGN.md](DESIGN.md) (kleuren, typografie, componenten)
- App-layout: zijbalk-navigatie (Dashboard, Kandidaten, Vacatures, Kalender, Instellingen), notificatie-bel, responsive basis

### Fase 2 — Kandidaten
**Resultaat: de kandidatendatabase is volledig bruikbaar.**

- Kandidatenoverzicht (los van vacatures): tabel met zoeken en filteren (naam, woonplaats, status)
- Knop **"Kandidaat toevoegen"**: formulier met contactgegevens, woonplaats en arbeidsvoorwaarden
- CV-upload (PDF/Word) naar een private Supabase Storage-bucket
- Kandidaatprofiel: alle gegevens, inline CV-viewer (PDF), notities toevoegen/bewerken
- Kandidaat bewerken, archiveren en verwijderen

### Fase 3 — Vacatures & funnel
**Resultaat: kandidaten stromen door een zelf in te stellen funnel per vacature.**

- Vacatures: aanmaken (alleen titel), status open/gesloten, lijst
- Funnel-fases beheren in Instellingen: toevoegen, hernoemen, volgorde slepen, kleur kiezen
- Kandidaat koppelen aan vacature (vanuit profiel én vanuit vacature)
- Kanban-bord per vacature: kandidaten met drag & drop door de fases slepen
- Op het kandidaatprofiel zichtbaar: aan welke vacatures gekoppeld, in welke fase

### Fase 4 — AVG-automatisering
**Resultaat: toestemmingsbeheer draait vanzelf.**

- Bij het aanmaken van een kandidaat automatisch een toestemmingsrecord: vastleggen hoe/wanneer toestemming is gegeven, einddatum = **+365 dagen**
- Dagelijkse pg_cron-job: toestemming verloopt binnen **30 dagen** → melding + taak "verlenging vragen"
- Verleng-knop: altijd opnieuw 365 dagen vanaf het moment van verlengen
- Verlopen zonder verlenging: kandidaat rood gemarkeerd, met 1-klik **anonimiseren of verwijderen**
- AVG-widget op het dashboard: wie verloopt binnenkort, wie is verlopen
- Optioneel (als er een Resend-account is): automatische e-mail aan de kandidaat met bevestigingslink voor verlenging

### Fase 5 — Contactmomenten & kalender
**Resultaat: je ziet altijd wie je te lang niet gesproken hebt.**

- Contactmomenten vastleggen op het profiel: type (gebeld / gemaild / gesprek), datum, notitie
- `laatst gesproken` wordt automatisch bijgewerkt en is zichtbaar in het kandidatenoverzicht
- Kalender: maandweergave met alle (geplande en geweeste) contactmomenten
- Dagelijkse check: laatste contact > **3 maanden** geleden → melding in het notificatiecentrum
- Notificatiecentrum: AVG- en contactmeldingen, aanklikbaar naar de kandidaat, af te vinken

### Fase 6 — Dashboard & oplevering
**Resultaat: de app staat live.**

- Dashboard: AVG-alerts, contact-reminders, funnel-overzicht, recent toegevoegde kandidaten
- Responsive polish (tablet/mobiel), lege-staten, laad- en foutafhandeling
- Deployment: Vercel + Supabase productieproject, omgevingsvariabelen, backupsbeleid
- Korte gebruikershandleiding in `docs/`

## Later misschien (bewust buiten scope)

- Automatische CV-parsing (velden voorinvullen vanuit het CV)
- E-mailintegratie / mailbox-sync
- Meerdere gebruikersrollen en rechten
- Rapportages en statistieken
- Kandidaten-portaal of sollicitatieformulier op de website

## Wat is er nodig van Jump Into People

| Wanneer | Wat |
|---|---|
| Fase 1 | Gratis Supabase-account + project |
| Fase 1 | Exacte huisstijlkleuren of het logo (het palet in DESIGN.md is een benadering) |
| Fase 4 (optioneel) | Resend-account voor automatische AVG-mails |
| Fase 6 | Vercel-account voor hosting |
