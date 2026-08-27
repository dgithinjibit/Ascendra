import { describe, expect, it, vi } from 'vitest'
import { createSandboxProvider } from '../sandbox-provider-runtime'
import type { WorkerArtifactJob } from '../sandbox-artifact-worker'

const imageJob: WorkerArtifactJob = {
  id: 'artifact-1',
  artifactType: 'image',
  prompt: 'Show eight octopus arms as a fraction model.',
  grade: 'g2',
  subject: 'mathematics',
  competency: 'MATH.G2.FRACTIONS',
  consentVerified: true,
  moderationStatus: 'approved',
  status: 'processing',
  expiresAt: '2099-01-01T00:00:00.000Z',
}

describe('sandbox provider runtime', () => {
  it('uses injected generation and storage only when media is explicitly enabled', async () => {
    const generateImage = vi.fn(async () => new Uint8Array([1, 2, 3]))
    const upload = vi.fn(async () => 'sandbox/artifact-1.png')
    const provider = createSandboxProvider(imageJob, {
      env: {
        GEMINI_API_KEY: 'test-key',
        SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true',
      },
      generateImage,
      upload,
    })

    expect(provider).not.toBeNull()
    const result = await provider!.generate(imageJob, new AbortController().signal)
    expect(generateImage).toHaveBeenCalledOnce()
    expect(upload).toHaveBeenCalledWith({
      artifactId: 'artifact-1',
      kind: 'image',
      bytes: new Uint8Array([1, 2, 3]),
      contentType: 'image/png',
    })
    expect(result).toEqual({
      storagePath: 'sandbox/artifact-1.png',
      containsLearnerData: false,
      moderationPassed: true,
    })
  })

  it('does not create a provider when the key or runtime dependencies are missing', () => {
    expect(createSandboxProvider(imageJob, {
      env: { SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true' },
      generateImage: vi.fn(),
      upload: vi.fn(),
    })).toBeNull()
    expect(createSandboxProvider(imageJob, {
      env: {
        GEMINI_API_KEY: 'test-key',
        SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true',
      },
      upload: vi.fn(),
    })).toBeNull()
  })
})
