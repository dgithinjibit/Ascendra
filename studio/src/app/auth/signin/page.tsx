/**
 * Sign In Page
 */

import { SignInForm } from '@/components/auth/sign-in-form';

export default function SignInPage() {
  return (
    <main className="education-shell flex items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--secondary))_0,_transparent_34rem)] p-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="education-kicker mb-3">CBC learning companion</p>
          <h1 className="mb-2 font-headline text-4xl font-bold text-primary">syncsenta</h1>
          <p className="text-muted-foreground">
            Welcome back! Continue your learning journey
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
