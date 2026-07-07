# Architectuur JIP-ATS

## Overzicht

```
┌─────────────────────────────┐
│  Next.js 15 (Vercel)        │  App Router, TypeScript, Tailwind + shadcn/ui
│  UI + Server Actions        │  Nederlandstalige interface
└──────────────┬──────────────┘
               │ supabase-js / @supabase/ssr
┌──────────────┴──────────────┐
│  Supabase                   │
│  ├─ Postgres  (datamodel + RLS)
│  ├─ Auth      (recruiters, e-mail + wachtwoord)
│  ├─ Storage   (CV's, private bucket, signed URLs)
│  └─ pg_cron   (dagelijkse AVG- en contactchecks)
└─────────────────────────────┘
```

**Waarom dit schaalbaar én simpel is:** alle state zit in Supabase (Postgres). De Next.js-app is stateless en kan horizontaal schalen op Vercel. Supabase groeit mee van gratis tier naar betaalde tiers zonder codewijziging, en is open source — self-hosten met Docker kan later altijd nog.

## Datamodel

```
profiles ──────────┐ (recruiters, 1-op-1 met auth.users)
                   │
candidates ────────┼──< candidate_notes
   │               ├──< contact_moments
   │               ├──< consents
   │               └──< applications >── vacancies
   │                         │
   │                         └── pipeline_stages
   └──< notifications (verwijzing)
```

### Tabellen

**`profiles`** — recruiters, gekoppeld aan `auth.users`
| kolom | type | opmerking |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | |

**`candidates`** — de kandidatendatabase (los van vacatures)
| kolom | type | opmerking |
|---|---|---|
| id | uuid PK | |
| first_name / last_name | text | |
| email / phone | text | contactgegevens |
| city | text | woonplaats |
| current_role | text | huidige functie (vrij veld) |
| salary_indication | text | arbeidsvoorwaarden: salarisindicatie |
| hours_per_week | int | arbeidsvoorwaarden |
| contract_preference | text | arbeidsvoorwaarden: vast/tijdelijk/zzp/… |
| availability | text | arbeidsvoorwaarden: beschikbaarheid |
| source | text | waar komt de kandidaat vandaan |
| cv_path | text | pad in Storage-bucket `cvs` (null = geen CV) |
| last_contact_at | timestamptz | automatisch bijgewerkt via trigger op `contact_moments` |
| status | enum | `actief` / `gearchiveerd` / `geanonimiseerd` |
| created_at / updated_at | timestamptz | |

**`candidate_notes`** — notities
`id, candidate_id FK, body, created_by FK profiles, created_at`

**`vacancies`** — vacatures, bewust alleen een titel
`id, title, status ('open'/'gesloten'), created_at`

**`pipeline_stages`** — zelf in te stellen funnel (globaal, geldt voor alle vacatures)
`id, name, position int, color text`
Standaardfases bij eerste start: *Nieuw → Gesproken → Voorgesteld → Interview → Aangenomen → Afgewezen*. Volledig te hernoemen, herordenen, uit te breiden of te verwijderen in Instellingen.

**`applications`** — koppeling kandidaat ↔ vacature (het kanban-bord)
`id, candidate_id FK, vacancy_id FK, stage_id FK, position int, created_at, updated_at`
Unieke combinatie (candidate_id, vacancy_id). `updated_at` toont hoe lang iemand in een fase staat.

**`contact_moments`** — wanneer is er contact geweest/gepland
`id, candidate_id FK, type ('gebeld'/'gemaild'/'gesprek'/'overig'), occurred_at timestamptz, note, created_by, created_at`
Trigger: na insert/update/delete wordt `candidates.last_contact_at` opnieuw berekend (max `occurred_at` ≤ nu). Momenten in de toekomst = gepland (zichtbaar in de kalender).

**`consents`** — AVG-toestemming
| kolom | type | opmerking |
|---|---|---|
| id | uuid PK | |
| candidate_id | FK | |
| granted_at | timestamptz | moment van toestemming |
| expires_at | timestamptz | altijd `granted_at + 365 dagen` |
| method | text | hoe is toestemming vastgelegd (telefonisch/e-mail/formulier) |
| status | enum | `actief` / `verloopt_binnenkort` / `verlopen` |
| reminder_sent_at | timestamptz | wanneer de 30-dagenmelding is aangemaakt (voorkomt duplicaten) |

Bij verlenging wordt een **nieuw** consent-record aangemaakt (audit-trail); het oude krijgt einde-status.

**`notifications`** — in-app meldingen
`id, user_id FK profiles, type ('avg_verloopt'/'avg_verlopen'/'geen_contact_3m'), candidate_id FK, message, read_at, created_at`

## AVG-automatisering

Automatisch gedrag, standaard aan — geen instelling die je kunt vergeten:

1. **Aanmaken kandidaat** → verplicht veld "toestemming vastgelegd via …" in het formulier → consent-record met `expires_at = nu + 365 dagen`.
2. **Dagelijkse pg_cron-job** (`select cron.schedule(...)`, draait 's nachts):
   - `expires_at` binnen 30 dagen én nog geen reminder → status `verloopt_binnenkort` + notificatie **"Vraag [kandidaat] om verlenging"**;
   - `expires_at` verstreken → status `verlopen` + notificatie; kandidaat wordt in de UI rood gemarkeerd.
3. **Verlengen** (knop op profiel en in de notificatie): nieuw consent-record, opnieuw 365 dagen.
4. **Niet verlengd** → 1-klik **anonimiseren** (persoonsgegevens overschreven met `[verwijderd]`, CV uit Storage verwijderd, notities gewist, status `geanonimiseerd`) of volledig verwijderen. Er verdwijnt nooit stilletjes data: de recruiter bevestigt altijd.
5. **Optioneel (Resend):** de 30-dagenmelding stuurt óók automatisch een e-mail naar de kandidaat met een unieke bevestigingslink; klik = verlenging geregistreerd.

Dezelfde dagelijkse job maakt ook de contactmeldingen aan: `last_contact_at` ouder dan 3 maanden (en kandidaat actief) → notificatie `geen_contact_3m` (max. 1 open melding per kandidaat).

## Beveiliging

- **RLS aan op álle tabellen.** Policies: alleen `authenticated` recruiters, met expliciete `USING`/`WITH CHECK` (conform de checklist in `.agents/skills/supabase/SKILL.md`).
- **CV's in een private Storage-bucket** (`cvs`); weergave in de app via kortlevende signed URLs. Nooit publieke URLs.
- **Geen service-role key in de browser**; alleen publishable key client-side, mutaties via Server Actions.
- Supabase Auth met e-mail + wachtwoord; open registratie uit — recruiters worden handmatig uitgenodigd.
- Verwijderen van een kandidaat cascadeert naar notities, contactmomenten, consents, applications én het CV-bestand.

## Projectstructuur (vanaf Fase 1)

```
src/
├── app/                  # routes: dashboard, kandidaten, vacatures, kalender, instellingen, login
├── components/           # ui/ (shadcn) + domeincomponenten (kanban, cv-viewer, kalender, …)
├── lib/supabase/         # client-, server- en middleware-helpers (@supabase/ssr)
└── lib/types.ts          # database-types (gegenereerd via supabase gen types)
supabase/
├── migrations/           # sql-migraties (incl. RLS-policies, triggers, cron-jobs)
└── config.toml
```
