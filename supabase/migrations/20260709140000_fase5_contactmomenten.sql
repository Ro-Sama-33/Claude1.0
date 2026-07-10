-- Fase 5 — Contactmomenten & kalender
-- Wanneer is er contact geweest of gepland. candidates.last_contact_at wordt
-- automatisch herberekend (max occurred_at ≤ nu); momenten in de toekomst
-- gelden als gepland (zichtbaar in de kalender). De dagelijkse job maakt de
-- "3 maanden geen contact"-melding aan. Zie docs/ARCHITECTUUR.md.

create type public.contact_type as enum ('gebeld', 'gemaild', 'gesprek', 'overig');

create table public.contact_moments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  type public.contact_type not null default 'gebeld',
  occurred_at timestamptz not null default now(),
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.contact_moments is
  'Contactmomenten (geweest of gepland); voedt candidates.last_contact_at.';

alter table public.contact_moments enable row level security;

create policy "contact_moments_select" on public.contact_moments
  for select to authenticated using (true);
-- Vastleggen op eigen naam; bewerken/verwijderen alleen je eigen momenten.
create policy "contact_moments_insert" on public.contact_moments
  for insert to authenticated
  with check ((select auth.uid()) = created_by);
create policy "contact_moments_update" on public.contact_moments
  for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);
create policy "contact_moments_delete" on public.contact_moments
  for delete to authenticated
  using ((select auth.uid()) = created_by);

create index contact_moments_candidate_idx
  on public.contact_moments (candidate_id, occurred_at desc);
create index contact_moments_occurred_idx
  on public.contact_moments (occurred_at);

-- last_contact_at herberekenen na elke wijziging (alleen momenten in het
-- verleden tellen). SECURITY DEFINER zodat de denormalisatie los van RLS klopt.
create function public.recompute_last_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cand uuid := coalesce(new.candidate_id, old.candidate_id);
begin
  update public.candidates c
  set last_contact_at = (
    select max(cm.occurred_at)
    from public.contact_moments cm
    where cm.candidate_id = cand
      and cm.occurred_at <= now()
  )
  where c.id = cand;
  return coalesce(new, old);
end;
$$;

revoke execute on function public.recompute_last_contact()
  from public, anon, authenticated;

create trigger contact_moments_recompute_last_contact
  after insert or update or delete on public.contact_moments
  for each row
  execute function public.recompute_last_contact();

-- Dagelijkse job uitbreiden: geplande momenten die inmiddels geweest zijn
-- meenemen in last_contact_at, en de "3 maanden geen contact"-melding maken.
create or replace function public.run_daily_checks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  -- 1. AVG-checks (fase 4)
  for rec in
    select distinct on (c.candidate_id)
      c.id as consent_id, c.candidate_id, c.expires_at, c.reminder_sent_at
    from public.consents c
    join public.candidates k on k.id = c.candidate_id
    where k.status = 'actief'
    order by c.candidate_id, c.granted_at desc
  loop
    if rec.expires_at <= now() then
      update public.consents set status = 'verlopen'
        where id = rec.consent_id and status <> 'verlopen';
      update public.notifications set read_at = now()
        where candidate_id = rec.candidate_id
          and type = 'avg_verloopt' and read_at is null;
      insert into public.notifications (candidate_id, type, message)
        values (rec.candidate_id, 'avg_verlopen',
          'AVG-toestemming is verlopen. Verleng, anonimiseer of verwijder de kandidaat.')
        on conflict (candidate_id, type) where read_at is null do nothing;
    elsif rec.expires_at <= now() + interval '30 days'
          and rec.reminder_sent_at is null then
      update public.consents
        set status = 'verloopt_binnenkort', reminder_sent_at = now()
        where id = rec.consent_id;
      insert into public.notifications (candidate_id, type, message)
        values (rec.candidate_id, 'avg_verloopt',
          'AVG-toestemming verloopt binnenkort. Vraag de kandidaat om verlenging.')
        on conflict (candidate_id, type) where read_at is null do nothing;
    end if;
  end loop;

  -- 2. last_contact_at verversen: geplande momenten die inmiddels geweest zijn
  update public.candidates c
  set last_contact_at = sub.laatste
  from (
    select candidate_id, max(occurred_at) as laatste
    from public.contact_moments
    where occurred_at <= now()
    group by candidate_id
  ) sub
  where c.id = sub.candidate_id
    and c.status = 'actief'
    and c.last_contact_at is distinct from sub.laatste;

  -- 3. Contactmelding: actief én langer dan 3 maanden geen contact
  insert into public.notifications (candidate_id, type, message)
  select k.id, 'geen_contact_3m',
    'Al meer dan 3 maanden geen contact. Plan een nieuw contactmoment.'
  from public.candidates k
  where k.status = 'actief'
    and k.last_contact_at is not null
    and k.last_contact_at < now() - interval '3 months'
  on conflict (candidate_id, type) where read_at is null do nothing;
end;
$$;
