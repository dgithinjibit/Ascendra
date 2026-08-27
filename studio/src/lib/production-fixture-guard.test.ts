import { describe, expect, it } from 'vitest'
import { checkProductionFixtureGuard } from './production-fixture-guard'

describe('production fixture guard', () => {
  it('allows local fixtures outside production', () => {
    expect(checkProductionFixtureGuard({ NODE_ENV: 'test', SYNC_SENTA_ALLOW_SYNTHETIC_DATA: 'true' })).toEqual({ allowed: true })
  })

  it('rejects synthetic data in production', () => {
    expect(checkProductionFixtureGuard({ NODE_ENV: 'production', SYNC_SENTA_ALLOW_SYNTHETIC_DATA: 'true' })).toEqual({
      allowed: false,
      reason: 'synthetic_data_enabled',
    })
  })

  it('rejects mock authentication in production', () => {
    expect(checkProductionFixtureGuard({ NODE_ENV: 'production', SYNC_SENTA_USE_MOCK_AUTH: 'true' })).toEqual({
      allowed: false,
      reason: 'mock_auth_enabled',
    })
  })

  it('rejects placeholder configuration in production', () => {
    expect(checkProductionFixtureGuard({ NODE_ENV: 'production', GEMINI_API_KEY: 'local-build-placeholder' })).toEqual({
      allowed: false,
      reason: 'placeholder_configuration',
    })
  })

  it('rejects localhost Rust service in production', () => {
    expect(checkProductionFixtureGuard({ NODE_ENV: 'production', SYNC_SENTA_RUST_ADAPTIVE_URL: 'http://127.0.0.1:8091' })).toEqual({
      allowed: false,
      reason: 'local_rust_endpoint',
    })
  })

  it('allows a realistic production shape', () => {
    expect(checkProductionFixtureGuard({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'live-anon-key',
      GEMINI_API_KEY: 'live-provider-key',
      SYNC_SENTA_RUST_ADAPTIVE_URL: 'https://rust.example.com',
    })).toEqual({ allowed: true })
  })
})
