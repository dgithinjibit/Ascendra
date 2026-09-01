#!/usr/bin/env node

/**
 * Pre-build check: Ensure the public application configuration is set.
 * Provider credentials are intentionally optional at build time: the API
 * routes check them at request time and fail closed when no provider is
 * configured, which keeps the $0 deployment path usable without inventing
 * or embedding credentials in the build.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ ERROR: Missing required environment variables:\n');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your Vercel dashboard:');
  console.error('Settings → Environment Variables\n');
  console.error('The AI provider keys are optional for the build and remain fail-closed at runtime.\n');
  process.exit(1);
}

const optionalProviderVars = ['GROQ_API_KEY', 'GEMINI_API_KEY'];
const missingProviders = optionalProviderVars.filter(varName => !process.env[varName]);

console.log('✅ Public application environment is configured');
if (missingProviders.length === optionalProviderVars.length) {
  console.warn('⚠ No AI provider key is configured; provider-backed routes will return a safe unavailable response.');
} else if (missingProviders.length > 0) {
  console.warn(`⚠ Optional provider key not configured: ${missingProviders.join(', ')}`);
}
process.exit(0);
