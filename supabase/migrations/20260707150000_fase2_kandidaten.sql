-- Fase 2 — Kandidaten
-- Kandidatendatabase, notities en AVG-toestemming (consents), plus de
-- private Storage-bucket voor CV's. De AVG-automatisering (cron, meldingen)
-- volgt in fase 4; het toestemmingsrecord wordt al wél bij het aanmaken
-- van een kandidaat vastgelegd (docs/ARCHITECTUUR.md → AVG-automatisering).

create type public.candidate_status as enum
  ('actief', 'gearchiveerd', 'geanonimiseerd');

create type public.consent_status as enum
  ('actief', 'verloopt_binnenkort', 'verlopen');

-- ---------------------------------------------------------------------------
-- candidates — de kandidatendatabase, los van vacatures
-- ---------------------------------------------------------------------------
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  city text,
  "current_role" text,
  salary_indication text,
  hours_per_week int,
  contract_preference text,
  availability text,
  source text,
  cv_path text,
  last_contact_at timestamptz,
  status public.candidate_status not null default 'actief',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.candidates is
  'Kandidatendatabase; cv_path verwijst naar de private bucket "cvs".';

alter table public.candidates enable row level security;

-- Interne teamtool: alle recruiters beheren samen de hele database
-- (bewust geen eigendom per recruiter — zie docs/ARCHITECTUUR.md).
create policy "candidates_select" on public.candidates
  for select to authenticated using (true);
create policy "candidates_insert" on public.candidates
  for insert to authenticated with check (true);
create policy "candidates_update" on public.candidates
  for update to authenticated using (true) with check (true);
create policy "candidates_delete" on public.candidates
  for delete to authenticated using (true);

create trigger candidates_set_updated_at
  before update on public.candidates
  for each row
  execute function public.set_updated_at();

create index candidates_status_idx on public.candidates (status);
create index candidates_city_idx on public.candidates (city);
create index candidates_name_idx on public.candidates (last_name, first_name);

-- ---------------------------------------------------------------------------
-- candidate_notes — notities op het profiel
-- ---------------------------------------------------------------------------
create table public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_notes enable row level security;

create policy "candidate_notes_select" on public.candidate_notes
  for select to authenticated using (true);

-- Notities schrijf je op eigen naam; bewerken/verwijderen alleen je eigen.
create policy "candidate_notes_insert" on public.candidate_notes
  for insert to authenticated
  with check ((select auth.uid()) = created_by);
create policy "candidate_notes_update" on public.candidate_notes
  for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);
create policy "candidate_notes_delete" on public.candidate_notes
  for delete to authenticated
  using ((select auth.uid()) = created_by);

create trigger candidate_notes_set_updated_at
  before update on public.candidate_notes
  for each row
  execute function public.set_updated_at();

create index candidate_notes_candidate_idx
  on public.candidate_notes (candidate_id, created_at desc);

-- ---------------------------------------------------------------------------
-- consents — AVG-toestemming (audit-trail: verlengen = nieuw record)
-- ---------------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  granted_at timestamptz not null default now(),
  -- Altijd granted_at + 365 dagen (docs/PLAN.md fase 4); als generated
  -- column kan de regel nergens in de app omzeild worden.
  expires_at timestamptz not null
    generated always as (granted_at + interval '365 days') stored,
  method text not null,
  status public.consent_status not null default 'actief',
  reminder_sent_at timestamptz
);

comment on table public.consents is
  'AVG-toestemmingsrecords; verlengen maakt een nieuw record aan.';

alter table public.consents enable row level security;

create policy "consents_select" on public.consents
  for select to authenticated using (true);
create policy "consents_insert" on public.consents
  for insert to authenticated with check (true);
create policy "consents_update" on public.consents
  for update to authenticated using (true) with check (true);
create policy "consents_delete" on public.consents
  for delete to authenticated using (true);

create index consents_candidate_idx
  on public.consents (candidate_id, granted_at desc);
create index consents_expires_idx on public.consents (expires_at);

-- ---------------------------------------------------------------------------
-- Storage: private bucket voor CV's (PDF/Word), toegang via signed URLs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- Upsert vereist INSERT + SELECT + UPDATE (checklist supabase-skill).
create policy "cvs_select" on storage.objects
  for select to authenticated using (bucket_id = 'cvs');
create policy "cvs_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'cvs');
create policy "cvs_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'cvs') with check (bucket_id = 'cvs');
create policy "cvs_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'cvs');
