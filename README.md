# HRFlow

HRFlow is a Node.js HR prototype for employee records, leave approvals, and work schedules. The API stores shared application data in Supabase Postgres; the browser never receives the Supabase secret key.

## Configure Supabase

1. Create a Supabase project.
2. In Supabase Dashboard, open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Copy `.env.example` to `.env`. Set `SUPABASE_URL` to the project URL and `SUPABASE_SECRET_KEY` to the project's secret key. Set `HRFLOW_SESSION_SECRET` to a long random value. Keep these values private and out of source control.
4. Seed demonstration records once:

   ```powershell
   npm run seed:demo
   ```

   The command refuses to seed if it finds existing HRFlow records. It is for a fresh project only.

5. Start the local app:

   ```powershell
   npm run dev
   ```

   Open <http://localhost:3000>.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `maya@hrflow.local` | `Admin123!` |
| Employee | `daniel@hrflow.local` | `Employee123!` |

Other seeded employees use `Welcome123!`. The Add employee form uses that password by default in this prototype.

## Included workflows

- Role-specific admin and employee dashboards.
- Employee search, creation, editing, department and position management, deactivation, and reactivation.
- Leave request submission, overlap and balance checks, admin approval and rejection, employee leave history, and balance updates.
- Shift creation, assignment, editing, deactivation, overnight shifts, and overlap checks.
- Schedule warnings when an employee has approved leave.
- In-app notifications for leave and schedule changes.
- Responsive layouts for desktop, tablet, and mobile.

Leave requests currently count calendar days, including weekends. Seed balances and the sample organization are demo values; adjust them before using the app with real employees.

## Deploy to Vercel

Import the repository into Vercel. It serves the static UI from `public/` and routes API requests to the Node.js serverless function in `api/rpc.js`. No build step or runtime package dependencies are required.

Set these environment variables in Vercel for each environment you use:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `HRFLOW_SESSION_SECRET`

Run the schema SQL once and seed the hosted Supabase project with `npm run seed:demo` from a trusted local machine. Do not seed a live database that already contains records. Supabase provides persistent shared data across Vercel function instances. The app uses the secret key only in Node.js and calls two restricted database functions; the functions run the full-state update atomically and reject stale writes.

## Notes

The SQL schema enables row level security and grants no direct table access to browser roles. Only the server-side Supabase secret key can call the HRFlow database functions. Supabase's current secret keys are preferred; the server also accepts `SUPABASE_SERVICE_ROLE_KEY` for projects still using the legacy key name. Both bypass row-level security and must never be exposed to browser code.

The seeded accounts are for demonstration only. The app does not include email delivery, password reset, multi-factor authentication, or production identity management.
