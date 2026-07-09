-- Fase 3 — Vacatures & funnel
-- Vacatures, een globaal instelbare funnel (pipeline_stages) en de koppeling
-- kandidaat ↔ vacature (applications = het kanban-bord). Zie docs/ARCHITECTUUR.md.
-- Zelfde team-RLS-model als candidates: alle ingelogde recruiters beheren samen.

create type public.vacancy_status as enum ('open', 'gesloten');

-- ---------------------------------------------------------------------------
-- vacancies — vacatures, bewust alleen een titel
-- ---------------------------------------------------------------------------
create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status public.vacancy_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vacancies is
  'Vacatures; kandidaten koppelen via applications (kanban).';

alter table public.vacancies enable row level security;

create policy "vacancies_select" on public.vacancies
  for select to authenticated using (true);
create policy "vacancies_insert" on public.vacancies
  for insert to authenticated with check (true);
create policy "vacancies_update" on public.vacancies
  for update to authenticated using (true) with check (true);
create policy "vacancies_delete" on public.vacancies
  for delete to authenticated using (true);

create trigger vacancies_set_updated_at
  before update on public.vacancies
  for each row
  execute function public.set_updated_at();

create index vacancies_status_idx on public.vacancies (status);

-- ---------------------------------------------------------------------------
-- pipeline_stages — globale funnel-fases (gelden voor alle vacatures)
-- ---------------------------------------------------------------------------
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null,
  color text not null default '#6B6580',
  created_at timestamptz not null default now()
);

comment on table public.pipeline_stages is
  'Zelf in te stellen funnel-fases, globaal voor alle vacatures.';

alter table public.pipeline_stages enable row level security;

create policy "pipeline_stages_select" on public.pipeline_stages
  for select to authenticated using (true);
create policy "pipeline_stages_insert" on public.pipeline_stages
  for insert to authenticated with check (true);
create policy "pipeline_stages_update" on public.pipeline_stages
  for update to authenticated using (true) with check (true);
create policy "pipeline_stages_delete" on public.pipeline_stages
  for delete to authenticated using (true);

create index pipeline_stages_position_idx on public.pipeline_stages (position);

-- Standaardfases bij eerste start (docs/ARCHITECTUUR.md); volledig aanpasbaar
-- in Instellingen. Kleuren afgeleid van het huisstijlpalet in docs/DESIGN.md.
insert into public.pipeline_stages (name, position, color) values
  ('Nieuw',        0, '#2E6FD8'),
  ('Gesproken',    1, '#5B2D90'),
  ('Voorgesteld',  2, '#7A4FB0'),
  ('Interview',    3, '#C7791B'),
  ('Aangenomen',   4, '#1E8E5A'),
  ('Afgewezen',    5, '#C43D3D');

-- ---------------------------------------------------------------------------
-- applications — koppeling kandidaat ↔ vacature (kanban-kaart)
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  vacancy_id uuid not null references public.vacancies (id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages (id) on delete restrict,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, vacancy_id)
);

comment on table public.applications is
  'Kandidaat in een vacature-funnel; updated_at toont hoe lang in een fase.';

alter table public.applications enable row level security;

create policy "applications_select" on public.applications
  for select to authenticated using (true);
create policy "applications_insert" on public.applications
  for insert to authenticated with check (true);
create policy "applications_update" on public.applications
  for update to authenticated using (true) with check (true);
create policy "applications_delete" on public.applications
  for delete to authenticated using (true);

create trigger applications_set_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

create index applications_vacancy_idx
  on public.applications (vacancy_id, stage_id, position);
create index applications_candidate_idx on public.applications (candidate_id);

-- Een fase mag alleen verwijderd worden als er geen kandidaten in staan
-- (docs/DESIGN.md → Instellingen). on delete restrict hierboven dekt de directe
-- FK af; deze trigger geeft een begrijpelijke Nederlandse melding.
create function public.check_stage_empty_before_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (select 1 from public.applications where stage_id = old.id) then
    raise exception 'Fase bevat nog kandidaten; verplaats ze eerst.'
      using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

create trigger pipeline_stages_prevent_nonempty_delete
  before delete on public.pipeline_stages
  for each row
  execute function public.check_stage_empty_before_delete();
