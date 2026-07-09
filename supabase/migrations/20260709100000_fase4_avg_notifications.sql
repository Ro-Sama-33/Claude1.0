-- Fase 4 — AVG-automatisering (deel 1: meldingen + dagelijkse check)
-- Zie docs/ARCHITECTUUR.md → AVG-automatisering. De contact-meldingen
-- (geen_contact_3m) volgen in fase 5; het type is hier al opgenomen zodat de
-- dagelijkse job in fase 5 alleen uitgebreid hoeft te worden.
--
-- Meldingen zijn globaal (gedeeld door alle recruiters), passend bij het
-- team-model van deze interne tool. read_at = afgevinkt.

create type public.notification_type as enum
  ('avg_verloopt', 'avg_verlopen', 'geen_contact_3m');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates (id) on delete cascade,
  type public.notification_type not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'In-app meldingen (AVG en contact), globaal; read_at = afgevinkt.';

alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications
  for select to authenticated using (true);
-- Afvinken (read_at zetten) mag; aanmaken doet de dagelijkse job hieronder.
create policy "notifications_update" on public.notifications
  for update to authenticated using (true) with check (true);

-- Hooguit één open melding per (kandidaat, type); voorkomt duplicaten bij de
-- dagelijkse job en dekt "max. 1 open contactmelding per kandidaat" (fase 5).
create unique index notifications_open_unique
  on public.notifications (candidate_id, type)
  where read_at is null;

create index notifications_unread_idx
  on public.notifications (created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- Dagelijkse AVG-check: statussen bijwerken en meldingen aanmaken.
-- SECURITY DEFINER zodat de nachtelijke job (geen ingelogde gebruiker) de
-- consents/notifications mag bijwerken; execute is ingetrokken voor de
-- API-rollen (checklist .agents/skills/supabase/SKILL.md).
-- ---------------------------------------------------------------------------
create function public.run_daily_checks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
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
      -- Een openstaande 'verloopt binnenkort'-melding is achterhaald.
      update public.notifications set read_at = now()
        where candidate_id = rec.candidate_id
          and type = 'avg_verloopt'
          and read_at is null;
      insert into public.notifications (candidate_id, type, message)
        values (
          rec.candidate_id,
          'avg_verlopen',
          'AVG-toestemming is verlopen. Verleng, anonimiseer of verwijder de kandidaat.'
        )
        on conflict (candidate_id, type) where read_at is null do nothing;

    elsif rec.expires_at <= now() + interval '30 days'
          and rec.reminder_sent_at is null then
      update public.consents
        set status = 'verloopt_binnenkort', reminder_sent_at = now()
        where id = rec.consent_id;
      insert into public.notifications (candidate_id, type, message)
        values (
          rec.candidate_id,
          'avg_verloopt',
          'AVG-toestemming verloopt binnenkort. Vraag de kandidaat om verlenging.'
        )
        on conflict (candidate_id, type) where read_at is null do nothing;
    end if;
  end loop;
end;
$$;

revoke execute on function public.run_daily_checks()
  from public, anon, authenticated;
