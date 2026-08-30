/**
 * Seed Test Accounts in Supabase
 * 
 * Run once to create test accounts for development/testing.
 * Usage: npx ts-node scripts/seed-test-accounts.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_ACCOUNTS = [
  {
    email: 'student01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Student 01',
    role: 'student' as const,
  },
  {
    email: 'teacher01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Teacher 01',
    role: 'teacher' as const,
  },
  {
    email: 'parent01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Parent 01',
    role: 'parent' as const,
  },
  {
    email: 'admin01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Admin 01',
    role: 'admin' as const,
  },
];

async function seedTestAccounts() {
  console.log('🌱 Seeding test accounts...\n');

  for (const account of TEST_ACCOUNTS) {
    try {
      // Create auth user
      const { data, error: signUpError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.name,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already exists')) {
          console.log(`⏭️  ${account.role.toUpperCase()}: ${account.email} already exists`);
          continue;
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error(`No user returned for ${account.email}`);
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: account.email,
          full_name: account.name,
          role: account.role,
          grade: account.role === 'student' ? 'Grade 6' : null,
          language_preference: account.role === 'student' ? 'mixed' : 'english',
          timezone: 'Africa/Nairobi',
          subscription_tier: 'free',
          subscription_status: 'active',
        });

      if (profileError) throw profileError;

      // Create student record if role is student
      if (account.role === 'student') {
        const { error: studentError } = await supabase.from('students').upsert({
          user_id: data.user.id,
          student_name: account.name,
          grade: 'Grade 6',
          status: 'active',
        });
        if (studentError) throw studentError;
      }

      console.log(`✅ ${account.role.toUpperCase()}: ${account.email}`);
      console.log(`   Password: ${account.password}\n`);
    } catch (error) {
      console.error(`❌ ${account.role.toUpperCase()}: Failed to create ${account.email}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log('✨ Done! Test accounts are ready.\n');
  console.log('Quick login with:');
  TEST_ACCOUNTS.forEach((acc) => {
    console.log(`  ${acc.role.toUpperCase()}: ${acc.email} / ${acc.password}`);
  });
}

seedTestAccounts().catch(console.error);
