-- 1.  Fat-row table  –  whole project snapshot (≤ 16 MB)
CREATE TABLE IF NOT EXISTS codeks.project_snapshots (
    project_id  text,
    version     timeuuid,          -- cluster key → history
    snapshot    text,              -- JSON of full tree
    size        int,               -- bytes
    updated_at  timestamp,
    PRIMARY KEY (project_id, version)
) WITH CLUSTERING ORDER BY (version DESC)
AND default_time_to_live = 0;      -- keep forever (or set TTL)

-- 2.  Split-row table  –  one row per file / folder
CREATE TABLE IF NOT EXISTS codeks.project_files (
    project_id  text,
    path        text,              -- e.g.  src/components/Button.tsx
    name        text,              -- leaf name (for quick display)
    is_folder   boolean,
    content     text,              -- NULL for folders
    checksum    text,              -- md5(content)
    embedding   vector<float,384>, -- 384-dim vector for semantic search
    updated_at  timestamp,
    PRIMARY KEY (project_id, path)
);

-- 3.  Storage-Attached Index (SAI) on embedding  →  ANN search
CREATE CUSTOM INDEX IF NOT EXISTS idx_embedding
ON codeks.project_files (embedding)
USING 'StorageAttachedIndex';

-- 4.  (Optional)  –  track last snapshot per project
CREATE TABLE IF NOT EXISTS codeks.project_meta (
    project_id  text PRIMARY KEY,
    last_version timeuuid,
    last_size    int,
    last_updated timestamp
);