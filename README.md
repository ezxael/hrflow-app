# HRFlow
<img width="277" height="97" alt="image" src="https://github.com/user-attachments/assets/4a3809bc-dc7c-47d0-93cc-7660b2964c7b" />
hrflow-app-one.vercel.app

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


## Data and limits

The app stores demo data in Supabase. It does not send email or support password resets or multi-factor authentication. Leave requests count calendar days, including weekends. Use demo accounts and sample data for this prototype.
