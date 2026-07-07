# JIP-ATS

Een eigen, basis **Applicant Tracking System (ATS)** voor [Jump Into People](https://jumpintopeople.nl/) — geïnspireerd op Loxo en Recruitee, maar bewust minimaal gehouden zodat het goedkoop en eenvoudig te hosten is.

## Wat is het?

Een intern recruitmentsysteem met:

- **Kandidatendatabase** — los van vacatures, met zoeken en filteren
- **Kandidaatprofiel** — contactgegevens, woonplaats, arbeidsvoorwaarden, CV (upload + inline viewer), notities
- **Vacatures** — alleen een titel, om kandidaten aan te koppelen
- **Aanpasbare funnel** — zelf in te stellen fases, kanban met drag & drop per vacature
- **AVG-automatisering** — toestemming standaard 365 dagen, automatische melding 30 dagen vóór de einddatum met verleng-actie (altijd opnieuw 365 dagen)
- **Contactmomenten & kalender** — bijhouden wanneer je een kandidaat voor het laatst sprak, met een melding na 3 maanden geen contact

## Stack

| Onderdeel | Keuze |
|---|---|
| Frontend + API | Next.js 15 (App Router, TypeScript) |
| Database, auth, opslag | Supabase (Postgres, Auth, Storage) |
| Styling | Tailwind CSS + shadcn/ui, huisstijl Jump Into People (paars/blauw/wit) |
| Geplande taken (AVG- en contactchecks) | Supabase pg_cron |
| Hosting | Vercel (app) + Supabase (data) — gratis tiers volstaan om te starten |
| E-mail (optioneel, AVG-fase) | Resend |

De UI is volledig Nederlandstalig.

## Documentatie

| Document | Inhoud |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Bouwplan: scope, fasering en oplevering per fase |
| [docs/ARCHITECTUUR.md](docs/ARCHITECTUUR.md) | Stack, datamodel, AVG-flows, notificaties, beveiliging |
| [docs/DESIGN.md](docs/DESIGN.md) | Design-systeem: kleuren, typografie, schermen |

## Snelstart (na Fase 1)

```bash
npm install
cp .env.example .env.local   # Supabase-keys invullen
npm run dev                  # http://localhost:3000
```

Benodigd: een gratis [Supabase](https://supabase.com)-project en (voor deployment) een [Vercel](https://vercel.com)-account.

## Agent-skills

De map `.agents/skills/` bevat de skills die tijdens het bouwen worden gebruikt (o.a. `supabase`, `frontend-design`, `ui-ux-pro-max`, `high-end-visual-design`). Zie `skills-lock.json` voor de herkomst.
