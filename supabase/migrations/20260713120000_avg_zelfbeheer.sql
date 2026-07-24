-- AVG-zelfbeheer via de mail-link
--   1) geheime token per kandidaat voor de openbare AVG-pagina;
--   2) functies waarmee de kandidaat (zonder login) de toestemming verlengt
--      of z'n gegevens laat verwijderen — direct doorgevoerd in het systeem;
--   3) de dagelijkse check verwijdert kandidaten automatisch die 30 dagen na
--      het verlopen van de toestemming niet hebben gereageerd.

-- Nieuwe meldingstypen voor de bel. (Alleen gebruikt binnen functie-bodies,
-- dus veilig binnen dezelfde transactie.)
alter type public.notification_type add value if not exists 'avg_verlengd';
alter type public.notification_type add value if not exists 'avg_verwijderd';

-- ---------------------------------------------------------------------------
-- 1) Geheime token per kandidaat
-- ---------------------------------------------------------------------------
alter table public.candidates
  add column if not exists avg_token uuid not null default gen_random_uuid();

create unique index if not exists candidates_avg_token_idx
  on public.candidates (avg_token);

comment on column public.candidates.avg_token is
  'Geheime token voor de openbare AVG-pagina (verlengen/verwijderen zonder login).';

-- ---------------------------------------------------------------------------
-- 2) Interne anonimiseer-helper — zelfde semantiek als in de app:
--    PII gewist, CV/notities/contactmomenten/koppelingen weg, meldingen
--    afgevinkt; consents blijven bewaard als audit-trail (bevatten geen PII).
-- ---------------------------------------------------------------------------
create or replace function public.avg_anonimiseer_intern(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from storage.objects
    where bucket_id = 'cvs' and name like p_candidate_id::text || '/%';
  delete from public.candidate_notes where candidate_id = p_candidate_id;
  delete from public.contact_moments where candidate_id = p_candidate_id;
  delete from public.applications where candidate_id = p_candidate_id;
  update public.notifications set read_at = now()
    where candidate_id = p_candidate_id and read_at is null;
  update public.candidates set
    first_name = '[verwijderd]',
    last_name = '[verwijderd]',
    email = null,
    phone = null,
    city = null,
    "current_role" = null,
    salary_indication = null,
    hours_per_week = null,
    contract_preference = null,
    availability = null,
    source = null,
    cv_path = null,
    status = 'geanonimiseerd'
  where id = p_candidate_id;
end;
$$;

revoke execute on function public.avg_anonimiseer_intern(uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Openbare functies voor de AVG-pagina (op token, zonder login).
--    SECURITY DEFINER omdat anon geen rechten op de tabellen heeft; de token
--    (onraadbare uuid) is de toegangssleutel.
-- ---------------------------------------------------------------------------

-- Gegevens voor de pagina: voornaam + einddatum + status.
create or replace function public.avg_pagina(p_token uuid)
returns table (
  voornaam text,
  einddatum timestamptz,
  kandidaat_status public.candidate_status
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    k.first_name,
    (select c.expires_at from public.consents c
      where c.candidate_id = k.id
      order by c.granted_at desc
      limit 1),
    k.status
  from public.candidates k
  where k.avg_token = p_token;
$$;

-- Verlengen: nieuw toestemmingsrecord (365 dagen vanaf nu).
-- Retourneert de nieuwe einddatum, of null bij een ongeldige link.
create or replace function public.avg_verleng(p_token uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_expires timestamptz;
begin
  select id into v_id from public.candidates
    where avg_token = p_token and status <> 'geanonimiseerd';
  if v_id is null then
    return null;
  end if;

  insert into public.consents (candidate_id, method)
    values (v_id, 'Zelf verlengd via AVG-mail')
    returning expires_at into v_expires;

  update public.notifications set read_at = now()
    where candidate_id = v_id
      and type in ('avg_verloopt', 'avg_verlopen')
      and read_at is null;

  insert into public.notifications (candidate_id, type, message)
    values (v_id, 'avg_verlengd',
      'De kandidaat heeft de AVG-toestemming zelf verlengd via de mail-link.')
    on conflict (candidate_id, type) where read_at is null do nothing;

  return v_expires;
end;
$$;

-- Verwijderen: alle persoonsgegevens gewist (anonimisering met audit-trail).
create or replace function public.avg_verwijder(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.candidates
    where avg_token = p_token and status <> 'geanonimiseerd';
  if v_id is null then
    return false;
  end if;

  perform public.avg_anonimiseer_intern(v_id);

  insert into public.notifications (candidate_id, type, message)
    values (v_id, 'avg_verwijderd',
      'De kandidaat heeft via de AVG-mail gekozen voor verwijdering; de persoonsgegevens zijn gewist.');

  return true;
end;
$$;

revoke execute on function public.avg_pagina(uuid) from public;
revoke execute on function public.avg_verleng(uuid) from public;
revoke execute on function public.avg_verwijder(uuid) from public;
grant execute on function public.avg_pagina(uuid) to anon, authenticated;
grant execute on function public.avg_verleng(uuid) to anon, authenticated;
grant execute on function public.avg_verwijder(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Dagelijkse check uitbreiden: 30 dagen na verlopen zonder reactie →
--    automatisch verwijderen (anonimiseren) + melding voor het team.
--    (Volledige functie; vervangt de fase 5-versie.)
-- ---------------------------------------------------------------------------
create or replace function public.run_daily_checks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  -- 1. AVG-checks (fase 4) + automatisch verwijderen na 30 dagen
  for rec in
    select distinct on (c.candidate_id)
      c.id as consent_id, c.candidate_id, c.expires_at, c.reminder_sent_at
    from public.consents c
    join public.candidates k on k.id = c.candidate_id
    where k.status = 'actief'
    order by c.candidate_id, c.granted_at desc
  loop
    if rec.expires_at <= now() - interval '30 days' then
      -- Geen reactie op de AVG-mail: gegevens automatisch wissen.
      perform public.avg_anonimiseer_intern(rec.candidate_id);
      insert into public.notifications (candidate_id, type, message)
        values (rec.candidate_id, 'avg_verwijderd',
          'Geen reactie binnen 30 dagen na het verlopen van de AVG-toestemming; de kandidaat is automatisch verwijderd (geanonimiseerd).');

    elsif rec.expires_at <= now() then
      update public.consents set status = 'verlopen'
        where id = rec.consent_id and status <> 'verlopen';
      update public.notifications set read_at = now()
        where candidate_id = rec.candidate_id
          and type = 'avg_verloopt' and read_at is null;
      insert into public.notifications (candidate_id, type, message)
        values (rec.candidate_id, 'avg_verlopen',
          'AVG-toestemming is verlopen. Zonder reactie wordt de kandidaat 30 dagen na de vervaldatum automatisch verwijderd.')
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

revoke execute on function public.run_daily_checks()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Standaard-mailtekst bijwerken (alleen als die nog ongewijzigd is) en de
--    kolom-default voor nieuwe installaties gelijktrekken.
-- ---------------------------------------------------------------------------
update public.app_settings
set avg_email_body =
$nieuw$Beste {{naam}},

Je hebt ons toestemming gegeven om je gegevens te bewaren voor werving en selectie. Deze toestemming verloopt op {{einddatum}}.

Wil je dat wij je gegevens mogen blijven bewaren? Via de knop onder deze mail regel je het direct: verleng de toestemming met 365 dagen, of laat je gegevens verwijderen. Reageer je niet, dan verwijderen wij je gegevens automatisch 30 dagen na de vervaldatum.

Met vriendelijke groet,
Jump Into People$nieuw$
where avg_email_body =
$oud$Beste {{naam}},

Je hebt ons toestemming gegeven om je gegevens te bewaren voor werving en selectie. Deze toestemming verloopt op {{einddatum}}.

Wil je dat wij je gegevens mogen blijven bewaren? Laat het ons weten, dan verlengen wij de toestemming met opnieuw 365 dagen.

Met vriendelijke groet,
Jump Into People$oud$;

alter table public.app_settings
  alter column avg_email_body set default
$tekst$Beste {{naam}},

Je hebt ons toestemming gegeven om je gegevens te bewaren voor werving en selectie. Deze toestemming verloopt op {{einddatum}}.

Wil je dat wij je gegevens mogen blijven bewaren? Via de knop onder deze mail regel je het direct: verleng de toestemming met 365 dagen, of laat je gegevens verwijderen. Reageer je niet, dan verwijderen wij je gegevens automatisch 30 dagen na de vervaldatum.

Met vriendelijke groet,
Jump Into People$tekst$;
