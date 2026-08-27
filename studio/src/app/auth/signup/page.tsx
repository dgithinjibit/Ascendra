/**
 * Sign Up Page
 */

import { Suspense } from 'react';
import { SignUpForm } from '@/components/auth/sign-up-form';

function SignupFormFallback() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 text-center text-sm text-muted-foreground">
      Loading secure signup…
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="education-shell flex items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--secondary))_0,_transparent_34rem)] p-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="education-kicker mb-3">Begin your learning path</p>
          <h1 className="mb-2 font-headline text-4xl font-bold text-primary">syncsenta</h1>
          <p className="text-muted-foreground">
            Your personal AI tutor for CBC curriculum
          </p>
        </div>
        <Suspense fallback={<SignupFormFallback />}>
          <SignUpForm />
        </Suspense>
      </div>
    </main>
  );
}
