-- Follow-up wijzigingen na oplevering
--   #7: bedrijf + locatie bij vacatures
--   #6: bewerkbare, algemene AVG-mailtekst (app_settings)

-- ---------------------------------------------------------------------------
-- #7 — vacatures: bedrijf en locatie
-- ---------------------------------------------------------------------------
alter table public.vacancies add column if not exists company text;
alter table public.vacancies add column if not exists location text;

-- ---------------------------------------------------------------------------
-- #6 — app_settings: één rij met de AVG-mailtekst
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  id boolean primary key default true,
  avg_email_subject text not null default 'Verlenging AVG-toestemming',
  avg_email_body text not null default
$tekst$Beste {{naam}},

Je hebt ons toestemming gegeven om je gegevens te bewaren voor werving en selectie. Deze toestemming verloopt op {{einddatum}}.

Wil je dat wij je gegevens mogen blijven bewaren? Laat het ons weten, dan verlengen wij de toestemming met opnieuw 365 dagen.

Met vriendelijke groet,
Jump Into People$tekst$,
  updated_at timestamptz not null default now(),
  constraint app_settings_one_row check (id)
);

comment on table public.app_settings is
  'Eén rij met app-instellingen; nu de algemene AVG-mailtekst.';

alter table public.app_settings enable row level security;

create policy "app_settings_select" on public.app_settings
  for select to authenticated using (true);
create policy "app_settings_update" on public.app_settings
  for update to authenticated using (true) with check (true);
-- Geen insert-policy: de enige rij wordt hier geseed.

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row
  execute function public.set_updated_at();

insert into public.app_settings (id) values (true) on conflict do nothing;
