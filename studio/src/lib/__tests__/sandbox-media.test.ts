import { describe, expect, it } from 'vitest';
import { resolveTeacherApprovedMedia, type TeacherApprovedSandboxMedia } from '../sandbox-media';

const approvedMedia: TeacherApprovedSandboxMedia = {
  kind: 'video',
  videoUrl: '/media/fractions-octopus.mp4',
  posterUrl: '/media/fractions-octopus-poster.webp',
  title: 'Fractions with an octopus',
  competency: 'MATH.G2.FRACTIONS',
  approved: true,
  childSafe: true,
  containsLearnerData: false,
};

describe('sandbox media policy', () => {
  it('resolves a teacher-approved, competency-matched local video', () => {
    expect(resolveTeacherApprovedMedia({ media: approvedMedia, competency: 'MATH.G2.FRACTIONS' })).toEqual({
      kind: 'video',
      videoUrl: '/media/fractions-octopus.mp4',
      posterUrl: '/media/fractions-octopus-poster.webp',
      title: 'Fractions with an octopus',
    });
  });

  it.each([
    ['not approved', { approved: false }],
    ['not child safe', { childSafe: false }],
    ['contains learner data', { containsLearnerData: true }],
    ['wrong competency', { competency: 'MATH.G2.COUNTING' }],
    ['unsafe URL', { videoUrl: 'http://example.com/video.mp4' }],
  ])('rejects media that is %s', (_reason, override) => {
    const media = { ...approvedMedia, ...override } as TeacherApprovedSandboxMedia;
    expect(resolveTeacherApprovedMedia({ media, competency: 'MATH.G2.FRACTIONS' })).toBeNull();
  });

  it('falls back when no media record is attached', () => {
    expect(resolveTeacherApprovedMedia({ competency: 'MATH.G2.FRACTIONS' })).toBeNull();
  });
});
