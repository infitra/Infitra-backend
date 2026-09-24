-- Snapshot only COMPLETED runs (2026-09-24, same day as the snapshot itself).
--
-- pg_cron writes the row when a run STARTS (status 'running', end_time null)
-- and updates it when it ends. refresh-cron-health fires on the same second
-- as the three every-minute jobs, so it kept catching them mid-flight and
-- storing end_time null. The pulse derives minutes_since_run from end_time,
-- and a null there means is_stale, so the panel would have shown its
-- healthiest jobs as stale most of the time.
--
-- Fix: take the latest run per job that has actually ENDED, and let the
-- watermark advance only past those. A run in progress is picked up on the
-- next pass once it finishes, and a job that hangs forever holds the
-- watermark where it is, which is correct: we keep looking at it, and its
-- ageing end_time trips the staleness alarm anyway.
create or replace function public.app_refresh_cron_health()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from bigint;
  v_n    integer;
begin
  select greatest(coalesce(max(last_runid), 0) - 100, 0) into v_from
    from public.app_cron_health;

  insert into public.app_cron_health as h (jobid, status, end_time, last_runid, updated_at)
  select distinct on (d.jobid) d.jobid, d.status, d.end_time, d.runid, now()
    from cron.job_run_details d
   where d.runid > v_from
     and d.end_time is not null
   order by d.jobid, d.runid desc
      on conflict (jobid) do update
         set status     = excluded.status,
             end_time   = excluded.end_time,
             last_runid = excluded.last_runid,
             updated_at = now()
       where excluded.last_runid >= h.last_runid;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.app_refresh_cron_health() from public, anon, authenticated;
