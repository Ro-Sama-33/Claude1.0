-- Toegangsverzoeken: aanmelden op de inlogpagina + goedkeuring door het team
--   Een aanmelding maakt GEEN account aan; het legt alleen een verzoek vast.
--   Pas na goedkeuring maakt de app (server-side, met de service-role) het
--   echte account aan. Een aanvrager heeft dus nooit een sessie of toegang tot
--   data — daarom hoeft de tabel-beveiliging elders niet te veranderen.

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  note text,
  status text not null default 'open',  -- open | goedgekeurd | afgewezen
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  constraint access_requests_status_check
    check (status in ('open', 'goedgekeurd', 'afgewezen'))
);

comment on table public.access_requests is
  'Aanvragen voor toegang via de inlogpagina; goedkeuring maakt pas een account aan.';

-- Hooguit één openstaand verzoek per e-mailadres.
create unique index access_requests_open_email_idx
  on public.access_requests (lower(email))
  where status = 'open';

create index access_requests_open_idx
  on public.access_requests (created_at desc)
  where status = 'open';

alter table public.access_requests enable row level security;

-- Anonieme bezoekers mogen een verzoek indienen (self-service aanmelden),
-- maar verder niets: geen select/update/delete voor anon.
create policy "access_requests_insert_anon" on public.access_requests
  for insert to anon, authenticated with check (true);

-- Ingelogde recruiters beoordelen de verzoeken.
create policy "access_requests_select" on public.access_requests
  for select to authenticated using (true);
create policy "access_requests_update" on public.access_requests
  for update to authenticated using (true) with check (true);
