import db from "../db/client.js";

export interface SyncState {
  id: string;
  user_id: string;
  entity_type: "event" | "task" | "expense";
  entity_id: string;
  last_synced_at: string | null;
  sync_direction: "local_to_remote" | "remote_to_local" | "bidirectional";
  remote_id: string | null;
  remote_etag: string | null;
  conflict_resolution: string;
}

// Record a sync action
export async function recordSync(
  userId: string,
  entityType: SyncState["entity_type"],
  entityId: string,
  remoteId: string | null = null,
  direction: SyncState["sync_direction"] = "bidirectional"
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO sync_states (id, user_id, entity_type, entity_id, last_synced_at, sync_direction, remote_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, entity_type, entity_id)
          DO UPDATE SET last_synced_at = ?, remote_id = COALESCE(?, remote_id), updated_at = ?`,
    args: [id, userId, entityType, entityId, now, direction, remoteId, now, remoteId, now],
  });
}

// Get sync state for an entity
export async function getSyncState(
  userId: string,
  entityType: SyncState["entity_type"],
  entityId: string
): Promise<SyncState | null> {
  const result = await db.execute({
    sql: `SELECT * FROM sync_states WHERE user_id = ? AND entity_type = ? AND entity_id = ?`,
    args: [userId, entityType, entityId],
  });
  return (result.rows[0] as unknown as SyncState) || null;
}

// Get all sync states for a user
export async function getUserSyncStates(
  userId: string,
  entityType?: SyncState["entity_type"]
): Promise<SyncState[]> {
  let sql = `SELECT * FROM sync_states WHERE user_id = ?`;
  const args: any[] = [userId];
  if (entityType) {
    sql += ` AND entity_type = ?`;
    args.push(entityType);
  }
  const result = await db.execute({ sql, args });
  return result.rows as unknown as SyncState[];
}

// Update sync status on events
export async function markEventSynced(eventId: string, googleEventId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE events SET sync_status = 'synced', google_event_id = ?, last_synced_at = ?, updated_at = ? WHERE id = ?`,
    args: [googleEventId, now, now, eventId],
  });
}

// Mark event as needing sync (local change)
export async function markEventDirty(eventId: string): Promise<void> {
  await db.execute({
    sql: `UPDATE events SET sync_status = 'local', updated_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), eventId],
  });
}