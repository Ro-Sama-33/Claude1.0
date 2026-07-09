-- Fase 4 — AVG-automatisering (deel 2: dagelijkse pg_cron-job)
-- Draait run_daily_checks() elke nacht om 02:00 UTC. Aparte migratie zodat een
-- eventueel rechtenprobleem met de extensie de rest van fase 4 niet blokkeert.

create extension if not exists pg_cron;

select cron.schedule(
  'avg-daily-checks',
  '0 2 * * *',
  $$ select public.run_daily_checks(); $$
);
