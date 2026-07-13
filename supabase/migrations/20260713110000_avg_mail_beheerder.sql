-- AVG-mail namens de beheerder van de kandidaat
--   1) profiles krijgt het e-mailadres van de recruiter (gesynchroniseerd
--      vanuit auth.users, ook voor nieuwe accounts);
--   2) candidates krijgt een beheerder (owner_id) — standaard degene die de
--      kandidaat aanmaakt. De AVG-mail gebruikt naam + adres van de beheerder
--      als afzendernaam en antwoordadres.

-- ---------------------------------------------------------------------------
-- 1) profiles.email
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text not null default '';

comment on column public.profiles.email is
  'E-mailadres van de recruiter, gesynchroniseerd vanuit auth.users.';

-- Bestaande accounts bijwerken.
update public.profiles p
set email = coalesce(u.email, '')
from auth.users u
where u.id = p.id
  and p.email = '';

-- Nieuwe accounts krijgen naam én e-mail mee.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) candidates.owner_id (beheerder)
-- ---------------------------------------------------------------------------
alter table public.candidates
  add column if not exists owner_id uuid
    references public.profiles (id) on delete set null;

create index if not exists candidates_owner_id_idx
  on public.candidates (owner_id);

comment on column public.candidates.owner_id is
  'Beheerder van de kandidaat (standaard de aanmaker); de AVG-mail wordt '
  'namens deze recruiter verstuurd.';
