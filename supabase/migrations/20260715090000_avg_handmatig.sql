-- AVG-verlenging wordt een handmatig proces
--   De zelfbedieningsflow (knop in de mail + openbare AVG-pagina) vervalt.
--   Het systeem signaleert elke toestemmingscyclus (365 dagen) 30 dagen vóór
--   het verlopen met een melding die de beheerder vraagt te bellen of mailen;
--   verlengen en verwijderen doet de recruiter daarna zelf in de app.
--   Automatisch verwijderen na 30 dagen vervalt.
--   (De meldingstypen avg_verlengd/avg_verwijderd blijven bestaan in het
--   enum-type — Postgres kan enum-waarden niet verwijderen; ze worden alleen
--   niet meer aangemaakt.)

-- ---------------------------------------------------------------------------
-- 1) Zelfbedieningsfuncties en token opruimen
-- ---------------------------------------------------------------------------
drop function if exists public.avg_pagina(uuid);
drop function if exists public.avg_verleng(uuid);
drop function if exists public.avg_verwijder(uuid);
drop function if exists public.avg_anonimiseer_intern(uuid);

alter table public.candidates drop column if exists avg_token;

-- De bewerkbare AVG-mailtekst is niet meer nodig.
drop table if exists public.app_settings;

-- ---------------------------------------------------------------------------
-- 2) Dagelijkse check: melding met beheerder, geen automatisch verwijderen
-- ---------------------------------------------------------------------------
create or replace function public.run_daily_checks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
  v_beheerder text;
  v_bericht text;
begin
  -- 1. AVG-checks: signaleren; verlengen/verwijderen doet de recruiter zelf.
  for rec in
    select distinct on (c.candidate_id)
      c.id as consent_id, c.candidate_id, c.expires_at, c.reminder_sent_at,
      k.owner_id
    from public.consents c
    join public.candidates k on k.id = c.candidate_id
    where k.status = 'actief'
    order by c.candidate_id, c.granted_at desc
  loop
    select nullif(trim(p.full_name), '') into v_beheerder
      from public.profiles p where p.id = rec.owner_id;

    if rec.expires_at <= now() then
      update public.consents set status = 'verlopen'
        where id = rec.consent_id and status <> 'verlopen';
      update public.notifications set read_at = now()
        where candidate_id = rec.candidate_id
          and type = 'avg_verloopt' and read_at is null;
      v_bericht := 'AVG-toestemming is verlopen. Bel of mail de kandidaat en '
        || 'verleng na akkoord, of verwijder de kandidaat.'
        || coalesce(' Beheerder: ' || v_beheerder || '.', '');
      insert into public.notifications (candidate_id, type, message)
        values (rec.candidate_id, 'avg_verlopen', v_bericht)
        on conflict (candidate_id, type) where read_at is null do nothing;

    elsif rec.expires_at <= now() + interval '30 days'
          and rec.reminder_sent_at is null then
      update public.consents
        set status = 'verloopt_binnenkort', reminder_sent_at = now()
        where id = rec.consent_id;
      v_bericht := 'AVG-toestemming verloopt binnenkort. Bel of mail de '
        || 'kandidaat en verleng na akkoord.'
        || coalesce(' Beheerder: ' || v_beheerder || '.', '');
      insert into public.notifications (candidate_id, type, message)
        values (rec.candidate_id, 'avg_verloopt', v_bericht)
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

revoke execute on function public.run_daily_checks()
  from public, anon, authenticated;
