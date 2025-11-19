-- 1. `projects` – Core project identity (one per project)
create table public.projects (
  id text primary key,                     -- matches Astra project_id
  name text not null,
  description text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FTS: enable full-text search on name + description
alter table public.projects add column ts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index projects_ts_idx on public.projects using gin(ts);

-- 2. `project_versions` – Versioned snapshots (one per save)
create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  version_label text,                      -- e.g. "v1", "autosave-2025-04-05", or auto-incremented
  version_number int,                      -- optional: for sorting (1, 2, 3...)
  astra_snapshot_version text not null,    -- the timeuuid from Astra (used to fetch heavy content)
  size_bytes int,
  created_at timestamptz default now(),
  is_latest boolean default false
);

-- Ensure only one `is_latest = true` per project
create unique index project_latest_version_unique 
  on public.project_versions (project_id) 
  where is_latest = true;

-- Index for fast history lookup
create index project_versions_by_project 
  on public.project_versions (project_id, created_at desc);

-- 3. Row-Level Security (RLS)
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;

create policy "User can manage own projects"
  on public.projects
  for all using (auth.uid() = owner_id);

create policy "User can see own project versions"
  on public.project_versions
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
  
-- 4. PostgreSQL function to create a new version safely
create or replace function create_project_version(
  p_project_id text,
  p_astra_version text,
  p_size_bytes int,
  p_version_label text default null
) returns void as $$
begin
  -- Mark all existing versions as not latest
  update public.project_versions
  set is_latest = false
  where project_id = p_project_id;

  -- Insert new version as latest
  insert into public.project_versions (
    project_id,
    astra_snapshot_version,
    size_bytes,
    version_label,
    is_latest
  ) values (
    p_project_id,
    p_astra_version,
    p_size_bytes,
    coalesce(p_version_label, 'autosave-' || now()::text),
    true
  );
end;
$$ language plpgsql security definer;

-- Grant usage to authenticated users
grant execute on function create_project_version to authenticated;