const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function loadLocalEnv() {
  if (process.env.VERCEL) return;
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadLocalEnv();

const TABLES = ['users', 'employees', 'departments', 'positions', 'leaveTypes', 'shifts', 'leaveRequests', 'schedules', 'notifications'];
const DELETE_ORDER = ['notifications', 'schedules', 'leaveRequests', 'users', 'employees', 'departments', 'positions', 'leaveTypes', 'shifts'];
const INSERT_ORDER = [...TABLES];
const passwordHash = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');

class StoreError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StoreError(503, 'Configure SUPABASE_URL and SUPABASE_SECRET_KEY to use HRFlow.');
  return { url, key };
}

async function rpc(name, body) {
  const { url, key } = config();
  let response;
  try {
    response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new StoreError(503, 'Could not reach Supabase. Check the project URL and network connection.');
  }
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const code = payload?.code;
    if (code === '40001') throw new StoreError(409, 'This record changed while you were editing. Refresh and try again.');
    if (response.status === 404 || code === 'PGRST202') throw new StoreError(503, 'HRFlow database functions are missing. Run supabase/schema.sql in the Supabase SQL Editor.');
    console.error(`Supabase ${name} failed (${response.status}):`, payload?.message || text);
    throw new StoreError(503, 'Supabase could not complete the database request. Check the database setup.');
  }
  return payload;
}

async function readSnapshot() {
  const snapshot = await rpc('hrflow_read_state', {});
  if (!snapshot || !snapshot.data) throw new StoreError(503, 'Supabase returned an invalid HRFlow database snapshot.');
  for (const table of TABLES) if (!Array.isArray(snapshot.data[table])) snapshot.data[table] = [];
  return snapshot;
}

async function update(mutator) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await readSnapshot();
    const result = mutator(snapshot.data);
    try {
      await rpc('hrflow_write_state', { p_state: snapshot.data, p_expected_revision: snapshot.revision });
      return result;
    } catch (error) {
      if (error.status !== 409 || attempt === 2) throw error;
    }
  }
  throw new StoreError(409, 'The database is busy. Refresh and try again.');
}

module.exports = { readSnapshot, update, passwordHash, TABLES, DELETE_ORDER, INSERT_ORDER };
