# HRFlow

HRFlow helps a small team manage employee records, leave requests, and work shifts. Admins manage the team. Employees view their leave balances, requests, schedules, and notifications.

## What the app includes

- Admin and employee dashboards.
- Employee records, departments, and positions.
- Leave requests, approvals, balances, and history.
- Shift setup and employee schedules.
- Schedule conflict checks and in-app notifications.
- A responsive interface for desktop and mobile.

## Stack

- Node.js 20 or later serves the API.
- Static HTML, CSS, and JavaScript serve the interface from `public/`.
- Supabase Postgres stores shared app data.
- Vercel serves the interface and runs the API function in `api/rpc.js`.

The app uses no runtime npm packages. The server uses Node's built-in `fetch` to call Supabase. The browser never receives the Supabase secret key.

## Set up Supabase

1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase Dashboard. Run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the example environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Edit `.env`. Add your Supabase project URL, server-side secret key, and a long session secret:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=your-server-side-secret-key
   HRFLOW_SESSION_SECRET=your-long-random-session-secret
   ```

Keep `.env` private. Git ignores it.

## Add demo data

Run this command once, after you create the schema in an empty database:

```powershell
npm run seed:demo
```

The seed command stops if it finds existing HRFlow data. It will not replace that data.

## Run the app

```powershell
npm run dev
```

Open <http://localhost:3000>.

| Account | Email | Password |
| --- | --- | --- |
| Admin | `maya@hrflow.local` | `Admin123!` |
| Employee | `daniel@hrflow.local` | `Employee123!` |

Other demo employees use `Welcome123!`.

## Deploy to Vercel

Import the GitHub repository into Vercel. Vercel reads `vercel.json` and deploys the static interface and Node.js API. The project needs no build command.

Add these environment variables in Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `HRFLOW_SESSION_SECRET`

Set them for Production and Preview deployments. Run the schema once in Supabase. Seed demo data only if the database is empty.

## Data and limits

The app stores demo data in Supabase. It does not send email or support password resets or multi-factor authentication. Leave requests count calendar days, including weekends. Use demo accounts and sample data for this prototype.
