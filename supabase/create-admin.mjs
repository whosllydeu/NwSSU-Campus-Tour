// ============================================================
// create-admin.mjs — creates (or promotes) the first admin account
// for the NwSSU Campus Tour Admin Dashboard.
//
// Uses the SERVICE ROLE key, which bypasses RLS and can call the
// Supabase Auth admin API — never expose this key to a browser.
//
// Usage:
//   npm install
//   npm run create-admin -- admin@nwssu.edu.ph SomeStrongPassword123
//
// Or set ADMIN_EMAIL / ADMIN_PASSWORD in .env and just run:
//   npm run create-admin
// ============================================================
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const [, , argEmail, argPassword] = process.argv;
const email = argEmail || process.env.ADMIN_EMAIL;
const password = argPassword || process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password>');
  console.error('   (or set ADMIN_EMAIL / ADMIN_PASSWORD in .env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingUserByEmail(targetEmail) {
  // supabase-js's admin.listUsers() doesn't filter by email server-side,
  // so page through and match locally. Fine for a small user base.
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log(`Looking for an existing account for ${email}...`);
  let user = await findExistingUserByEmail(email);

  if (user) {
    console.log('✓ Account already exists — will promote it to admin.');
  } else {
    console.log('No existing account found — creating one...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log('✓ Auth user created.');
  }

  // The handle_new_user() trigger in schema.sql creates a profiles row
  // automatically on signup, but it can lag by a moment for a
  // freshly-created user — wait for it before promoting.
  let profile = null;
  for (let attempt = 0; attempt < 5 && !profile; attempt++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) { profile = data; break; }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!profile) {
    // Trigger hasn't fired yet (or this project predates it) — insert directly.
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, role: 'admin' });
    if (insertError) throw insertError;
    console.log('✓ Profile created with role=admin.');
  } else if (profile.role !== 'admin') {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);
    if (updateError) throw updateError;
    console.log('✓ Profile promoted to role=admin.');
  } else {
    console.log('✓ Profile is already role=admin — nothing to change.');
  }

  console.log(`\nDone. ${email} can now sign in to the Admin Dashboard.`);
}

main().catch((err) => {
  console.error('✗', err.message || err);
  process.exit(1);
});
