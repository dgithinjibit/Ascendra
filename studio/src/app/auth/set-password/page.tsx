'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 8;

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get('next') || '/';

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError || !data.session) {
        router.replace('/auth/signin?message=Please%20sign%20in%20with%20Google%20to%20set%20your%20password');
        return;
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError('We could not save your password. Please try again.');
      setSaving(false);
      return;
    }

    router.replace(next.startsWith('/') ? next : '/');
  };

  if (loading) {
    return (
      <main className="education-shell flex items-center justify-center p-5">
        <p className="text-sm text-muted-foreground">Checking your secure session…</p>
      </main>
    );
  }

  return (
    <main className="education-shell flex items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--secondary))_0,_transparent_34rem)] p-5">
      <Card className="w-full max-w-md border-border/80 shadow-[0_18px_45px_hsl(174_30%_16%/0.1)]">
        <CardHeader>
          <CardTitle>Create your SyncSenta password</CardTitle>
          <CardDescription>
            Your Google account is connected. Set a password so you can sign in with your email on any device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={saving}
                required
              />
              <p className="text-xs text-muted-foreground">At least 8 characters. SyncSenta never stores the plaintext password.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={saving}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving password…</> : 'Save password and continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<main className="education-shell flex min-h-screen items-center justify-center p-5"><p className="text-sm text-muted-foreground">Loading secure password setup…</p></main>}>
      <SetPasswordForm />
    </Suspense>
  );
}
