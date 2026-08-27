import { describe, expect, it, vi } from 'vitest';
import { runSandboxArtifactWorkerOnce } from '../sandbox-artifact-runner';
import { getSupabaseServerClient } from '../supabase/server';

const fakeClient = {
  rpc: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
} as unknown as ReturnType<typeof getSupabaseServerClient>;

describe('sandbox artifact runner', () => {
  it('is disabled by default without touching Supabase', async () => {
    const result = await runSandboxArtifactWorkerOnce({ env: {}, supabase: fakeClient });
    expect(result).toEqual({ state: 'disabled' });
    expect(fakeClient.rpc).not.toHaveBeenCalled();
  });

  it('returns idle when the atomic claim finds no job', async () => {
    const result = await runSandboxArtifactWorkerOnce({
      env: { SYNC_SENTA_ENABLE_ARTIFACT_WORKER: 'true' },
      supabase: fakeClient,
    });
    expect(result).toEqual({ state: 'idle' });
    expect(fakeClient.rpc).toHaveBeenCalledWith('claim_sandbox_artifact', expect.objectContaining({ p_worker_id: expect.any(String) }));
  });
});
