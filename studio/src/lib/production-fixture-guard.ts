const FORBIDDEN_MARKERS = [
  'placeholder',
  'local-build',
  'local-contract',
  'local-mobile',
  'test-key',
  'synthetic',
  'mock-auth',
  'demo-student',
  'student0',
  'student_01',
  'teacher_01',
  'head_1',
  'parent_01',
]

export type ProductionFixtureGuardResult =
  | { allowed: true }
  | { allowed: false; reason: 'synthetic_data_enabled' | 'mock_auth_enabled' | 'placeholder_configuration' | 'local_rust_endpoint' }

export function checkProductionFixtureGuard(
  environment: Record<string, string | undefined> = process.env,
): ProductionFixtureGuardResult {
  if (environment.NODE_ENV !== 'production') return { allowed: true }
  if (environment.SYNC_SENTA_ALLOW_SYNTHETIC_DATA === 'true') return { allowed: false, reason: 'synthetic_data_enabled' }
  if (environment.SYNC_SENTA_USE_MOCK_AUTH === 'true' || environment.REQUIRE_MOCK_AUTH === 'true') {
    return { allowed: false, reason: 'mock_auth_enabled' }
  }

  const runtimeValues = [
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    environment.GROQ_API_KEY,
    environment.GEMINI_API_KEY,
    environment.SYNC_SENTA_RUST_ADAPTIVE_URL,
  ].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase())
  if (runtimeValues.some((value) => FORBIDDEN_MARKERS.some((marker) => value.includes(marker)))) {
    return { allowed: false, reason: 'placeholder_configuration' }
  }

  const rustUrl = environment.SYNC_SENTA_RUST_ADAPTIVE_URL?.trim()
  if (rustUrl && (rustUrl.startsWith('http://127.0.0.1:') || rustUrl.startsWith('http://localhost:'))) {
    return { allowed: false, reason: 'local_rust_endpoint' }
  }
  return { allowed: true }
}
