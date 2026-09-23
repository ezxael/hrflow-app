const { readSnapshot, update } = require('./store');
const { initialData } = require('./demo-data');

async function seed() {
  const snapshot = await readSnapshot();
  const hasRows = Object.values(snapshot.data).some((rows) => rows.length > 0);
  if (hasRows) {
    console.error('Supabase already contains HRFlow data. Seed cancelled to protect it.');
    process.exitCode = 1;
    return;
  }
  await update((state) => {
    const demo = initialData();
    for (const [key, rows] of Object.entries(demo)) state[key] = rows;
  });
  console.log('HRFlow demo data added to Supabase.');
  console.log('Admin: maya@hrflow.local / Admin123!');
  console.log('Employee: daniel@hrflow.local / Employee123!');
}

seed().catch((error) => {
  console.error(error.message || 'Could not seed the Supabase database.');
  process.exitCode = 1;
});
