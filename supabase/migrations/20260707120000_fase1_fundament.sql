-- Fase 1 — Fundament
-- Recruiters (profiles) gekoppeld aan auth.users, met RLS.
-- Zie docs/ARCHITECTUUR.md voor het volledige datamodel; de overige tabellen
-- volgen in de migraties van fase 2 t/m 5.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Recruiters van Jump Into People, 1-op-1 met auth.users.';

alter table public.profiles enable row level security;

-- Recruiters zien elkaars naam (nodig voor notities en tijdlijn),
-- maar kunnen alleen hun eigen profiel wijzigen.
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Geen insert/delete-policies: profielen ontstaan via de trigger hieronder
-- en verdwijnen via de cascade op auth.users.

-- updated_at automatisch bijwerken (herbruikbaar voor latere tabellen)
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Nieuw auth-account (handmatig uitgenodigd) → automatisch een profiel.
-- full_name uit user_metadata is alleen weergave, geen autorisatie.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

-- security definer in het public-schema: niet aanroepbaar voor API-rollen
-- (checklist .agents/skills/supabase/SKILL.md)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
