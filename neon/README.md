# Neon Database Setup

## Structure

```
neon/
├── scripts/        ← One-time setup (run manually as admin)
│   ├── 001_create_database.sql
│   └── 002_create_app_user.sql
└── migrations/     ← Schema changes (run in order against 'rentencheck' DB)
    ├── 001_schema.sql
    ├── 002_free_report_leads.sql
    └── 003_users.sql
```

## Initial Setup (Run Once)

### Prerequisites
- A Neon project with the default `neondb` database
- Admin/owner connection string (from Neon Dashboard → Connection Details)

### Step-by-step

```bash
# 1. Create the dedicated database (connect to default neondb)
psql "$DEFAULT_DATABASE_URL" -f neon/scripts/001_create_database.sql

# 2. Run all migrations (connect to the NEW rentencheck database)
psql "$ADMIN_RENTENCHECK_URL" -f neon/migrations/001_schema.sql
psql "$ADMIN_RENTENCHECK_URL" -f neon/migrations/002_free_report_leads.sql
psql "$ADMIN_RENTENCHECK_URL" -f neon/migrations/003_users.sql

# 3. Create the app user (still connected as admin to rentencheck)
#    ⚠️ Edit the password in the script first!
psql "$ADMIN_RENTENCHECK_URL" -f neon/scripts/002_create_app_user.sql
```

> **💡 Tip:** You can also paste each script into the Neon Dashboard → SQL Editor.
> Just make sure to select the correct database in the dropdown.

### Step 4: Update Netlify Environment Variable

Set `DATABASE_URL` in Netlify to:

```
postgresql://rentencheck_app:<YOUR_PASSWORD>@<NEON_HOST>/rentencheck?sslmode=require
```

Find `<NEON_HOST>` in your Neon Dashboard → Connection Details (e.g., `ep-cool-name-123456.eu-central-1.aws.neon.tech`).

## Adding Future Migrations

1. Create a new file: `neon/migrations/004_description.sql`
2. Run it against the `rentencheck` database as admin
3. The `ALTER DEFAULT PRIVILEGES` in the user script ensures the app user automatically gets access to new tables

