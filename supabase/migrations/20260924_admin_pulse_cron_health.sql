-- The admin board timed out (2026-09-24).
--
-- /admin showed "Something went wrong". One of its eight loads, admin_pulse,
-- was being killed by the 8s statement_timeout Supabase sets on the
-- `authenticated` role. It looked healthy from an MCP/psql session because
-- `postgres` carries no such limit: the board was the only caller that could
-- ever hit it, which is why nothing else broke and why reading the code
-- found nothing.
--
-- Cause: pg_cron writes one row per run per job and never prunes. Four jobs
-- run every minute, so cron.job_run_details had reached 253,129 rows and
-- 155 MB since June, carrying ONLY a primary key on runid. The pulse asked
-- for the latest run of each job:
--
--     select status, end_time from cron.job_run_details
--     where jobid = j.jobid order by start_time desc limit 1
--
-- With no index on (jobid, start_time) that is a sequential scan plus a sort,
-- once per job. Measured at 8,519 ms, growing every day until it crossed
-- eight seconds. Nothing in the application changed; the board aged into it.
--
-- The obvious fixes are NOT available to us: cron.job_run_details is owned by
-- supabase_admin, and this database's `postgres` is neither a superuser nor a
-- member of that role, so we can add neither the index nor a retention purge.
-- That is a platform action and needs Supabase. THE TABLE KEEPS GROWING.
--
-- So the board stops reading it on the request path. runid is the primary key
-- and monotonic, so reading only what is NEW is an index range scan instead
-- of a table scan: 12.5 ms against 8,519 ms on the same data.
--
-- A one-row-per-job snapshot lives in app_cron_health, refreshed every minute
-- by its own job, and the pulse joins that. If the refresher ever dies the
-- snapshot ages, every job crosses its staleness threshold and the panel goes
-- red, which is the correct alarm rather than a silent lie.
--
-- Result: admin_pulse 8,519 ms -> 125 ms.

create table if not exists public.app_cron_health (
  jobid       bigint primary key,
  -- Deliberately named `status` and `end_time`, matching the columns the
  -- lateral used to return, so the pulse's surrounding SQL is untouched.
  status      text,
  end_time    timestamptz,
  last_runid  bigint not null,
  updated_at  timestamptz not null default now()
);

alter table public.app_cron_health enable row level security;
revoke all on table public.app_cron_health from anon, authenticated;

comment on table public.app_cron_health is
  'One row per pg_cron job: its latest run. Refreshed every minute from cron.job_run_details by an incremental runid read, because that table is 155MB with no usable index and scanning it blew the admin board''s 8s statement timeout (24 Sep 2026).';

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
  -- Re-read the last 100 runids as well: a row is written when a run STARTS
  -- and updated when it ends, so a strict high-water mark would freeze some
  -- jobs on status 'running' forever.
  select greatest(coalesce(max(last_runid), 0) - 100, 0) into v_from
    from public.app_cron_health;

  insert into public.app_cron_health as h (jobid, status, end_time, last_runid, updated_at)
  select distinct on (d.jobid) d.jobid, d.status, d.end_time, d.runid, now()
    from cron.job_run_details d
   where d.runid > v_from
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

-- Seed once, bounded by runid so this is an index range scan and not the
-- 8.5s table scan. 50,000 runids is roughly eight days, which covers the
-- daily jobs as well as the every-minute ones.
insert into public.app_cron_health as h (jobid, status, end_time, last_runid, updated_at)
select distinct on (d.jobid) d.jobid, d.status, d.end_time, d.runid, now()
  from cron.job_run_details d
 where d.runid > (select greatest(max(runid) - 50000, 0) from cron.job_run_details)
 order by d.jobid, d.runid desc
    on conflict (jobid) do update
       set status = excluded.status, end_time = excluded.end_time,
           last_runid = excluded.last_runid, updated_at = now();

select cron.schedule('refresh-cron-health', '* * * * *',
                     $$select public.app_refresh_cron_health()$$);

-- Swap the lateral for the snapshot. Surgical rather than a retyped function:
-- admin_pulse carries eighteen checks and retyping invites drift.
do $patch$
declare
  fn  regprocedure;
  def text;
  old text := E'        left join lateral (\n'
           || E'            select status, end_time from cron.job_run_details\n'
           || E'            where jobid = j.jobid order by start_time desc limit 1\n'
           || E'        ) d on true';
  new text := E'        left join public.app_cron_health d on d.jobid = j.jobid';
  n   int;
begin
  select p.oid::regprocedure into fn
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'admin_pulse';

  def := pg_get_functiondef(fn);
  n := (length(def) - length(replace(def, old, ''))) / length(old);
  if n <> 1 then
    raise exception 'cron lateral found % times in admin_pulse, expected 1', n;
  end if;

  execute replace(def, old, new);
end
$patch$;
