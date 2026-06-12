import db from "./client.js";

const migrations: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    biometric_enabled INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS calendars (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    is_confidential INTEGER NOT NULL DEFAULT 0,
    google_calendar_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_all_day INTEGER NOT NULL DEFAULT 0,
    meeting_link TEXT,
    meeting_notes TEXT,
    alert_minutes_before INTEGER DEFAULT 10,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status TEXT NOT NULL DEFAULT 'local',
    google_event_id TEXT,
    last_synced_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','rolled')),
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_interval TEXT CHECK(recurring_interval IS NULL OR recurring_interval IN ('daily','weekly','monthly')),
    category TEXT DEFAULT 'personal' CHECK(category IN ('work','personal','family','health')),
    original_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS task_rollovers (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    rolled_from_date TEXT NOT NULL,
    rolled_to_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT DEFAULT '',
    date TEXT NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_interval TEXT CHECK(recurring_interval IS NULL OR recurring_interval IN ('weekly','monthly','yearly')),
    original_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    alert_at TEXT,
    triggered INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'free' CHECK(type IN ('free','paid')),
    price REAL NOT NULL DEFAULT 0,
    content TEXT NOT NULL DEFAULT '{}',
    author_id TEXT REFERENCES users(id),
    downloads INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    is_handwritten INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    expiry_date TEXT NOT NULL,
    google_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
  )`,

  `CREATE TABLE IF NOT EXISTS apple_caldav_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    server_url TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    principal_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
  )`,

  `CREATE TABLE IF NOT EXISTS microsoft_calendar_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    email TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
  )`,

  `CREATE TABLE IF NOT EXISTS sync_states (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('event','task','expense')),
    entity_id TEXT NOT NULL,
    last_synced_at TEXT,
    sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK(sync_direction IN ('local_to_remote','remote_to_local','bidirectional')),
    remote_id TEXT,
    remote_etag TEXT,
    conflict_resolution TEXT DEFAULT 'last_write_wins',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, entity_type, entity_id)
  )`,

  `CREATE TABLE IF NOT EXISTS expense_generations (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    generated_from_date TEXT NOT NULL,
    generated_to_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS stripe_customers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id),
    UNIQUE(stripe_customer_id)
  )`,

  `CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    amount REAL NOT NULL,
    alert_threshold REAL NOT NULL DEFAULT 80,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, category, month)
  )`,

  `CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS calendar_shares (
    id TEXT PRIMARY KEY,
    calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_email TEXT NOT NULL,
    shared_with_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    permission TEXT NOT NULL DEFAULT 'view' CHECK(permission IN ('view','edit')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(calendar_id, shared_with_email)
  )`,

  `CREATE TABLE IF NOT EXISTS event_invites (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    calendar_id TEXT NOT NULL,
    invited_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','maybe')),
    rsvp_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(event_id, invited_email)
  )`,
];

export async function runMigrations() {
  console.log("Running database migrations...");
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch (err) {
      console.error("Migration error:", err);
      throw err;
    }
  }
  console.log("Migrations complete.");

  // Add new columns for existing tables (safe for repeated runs)
  const alterStatements = [
    `ALTER TABLE events ADD COLUMN google_event_id TEXT`,
    `ALTER TABLE events ADD COLUMN last_synced_at TEXT`,
    `ALTER TABLE expenses ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE expenses ADD COLUMN recurring_interval TEXT`,
    `ALTER TABLE expenses ADD COLUMN original_date TEXT`,
    `ALTER TABLE calendars ADD COLUMN google_calendar_id TEXT`,
    `ALTER TABLE expenses ADD COLUMN receipt_url TEXT`,
  ];

  for (const sql of alterStatements) {
    try {
      await db.execute(sql);
      console.log(`  Applied: ${sql.substring(0, 60)}...`);
    } catch (err: any) {
      if (!err.message?.includes("duplicate column")) {
        console.warn(`  Skipped: ${sql.substring(0, 60)}...`);
      }
    }
  }

  // Create indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_states_user ON sync_states(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON google_calendar_tokens(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_apple_tokens_user ON apple_caldav_tokens(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_ms_tokens_user ON microsoft_calendar_tokens(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_calendar_shares_calendar ON calendar_shares(calendar_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_calendar_shares_email ON calendar_shares(shared_with_email)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_calendar_shares_user ON calendar_shares(shared_with_user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_event_invites_event ON event_invites(event_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_event_invites_email ON event_invites(invited_email)`);

  console.log("All indexes created.");
}

// Run if called directly
if (process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}