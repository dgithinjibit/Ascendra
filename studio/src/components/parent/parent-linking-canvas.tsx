'use client';

import { useMemo, useState } from 'react';
import { Clipboard, Link2, Loader2, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';

type LinkResult = { student_profile_id: string; linked_at: string };

function extractCode(value: string): string {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get('code') || url.searchParams.get('studentCode');
    if (fromQuery) return fromQuery;
  } catch {
    // A short code is also valid input; URL parsing is deliberately optional.
  }
  return trimmed;
}

function normalizeCode(value: string): string {
  return extractCode(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function ParentLinkingCanvas({ onLinked }: { onLinked?: (result: LinkResult) => void }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'pasting' | 'linking' | 'linked'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [linkedStudentId, setLinkedStudentId] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeCode(value), [value]);
  const isValidLength = normalized.length >= 12;

  async function pasteFromClipboard() {
    setMessage(null);
    setStatus('pasting');
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard access is not available in this browser. You can paste into the field manually.');
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) throw new Error('The clipboard is empty. Copy the student code first.');
      setValue(text);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Clipboard access was declined. Paste the code manually.');
    } finally {
      setStatus('idle');
    }
  }

  async function linkStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!isValidLength) {
      setMessage('Enter the complete student code or the full link shared by the learner.');
      return;
    }

    setStatus('linking');
    const { data, error } = await (supabase as any).rpc('redeem_student_link_code', { p_code: normalized });
    if (error) {
      setMessage('This code is invalid, expired, already used, or you are not signed in as a parent or guardian. No learner information was accessed.');
      setStatus('idle');
      return;
    }

    const result = (Array.isArray(data) ? data[0] : data) as LinkResult | undefined;
    if (!result?.student_profile_id) {
      setMessage('The link could not be verified. No learner information was accessed.');
      setStatus('idle');
      return;
    }

    setLinkedStudentId(result.student_profile_id);
    setStatus('linked');
    onLinked?.(result);
  }

  if (status === 'linked') {
    return (
      <Card className="border-emerald-200 bg-emerald-50/70">
        <CardHeader>
          <Badge className="w-fit bg-emerald-700 text-white">Relationship verified</Badge>
          <CardTitle className="flex items-center gap-2 text-emerald-950"><ShieldCheck className="h-5 w-5" aria-hidden="true" />Learner connected safely</CardTitle>
          <CardDescription className="text-emerald-900/80">The relationship is now active. Only consent-authorized parent information will be available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-950">Reference: <span className="font-mono">{linkedStudentId?.slice(0, 8)}…</span></p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-200 bg-white shadow-sm">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">No learner linked</Badge>
        <CardTitle className="flex items-center gap-2"><UserRoundPlus className="h-5 w-5 text-teal-700" aria-hidden="true" />Connect a learner</CardTitle>
        <CardDescription>Ask the learner to open their profile, generate a guardian code, and share the code or link with you. Until this succeeds, this account cannot see learner information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={linkStudent} className="space-y-4">
          {message && <Alert variant="destructive" role="alert"><AlertDescription>{message}</AlertDescription></Alert>}
          <div className="space-y-2">
            <Label htmlFor="student-link-code">Student code or shared link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="student-link-code" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste the code or full link" autoComplete="off" spellCheck={false} disabled={status === 'linking' || status === 'pasting'} />
              <Button type="button" variant="outline" onClick={pasteFromClipboard} disabled={status === 'linking' || status === 'pasting'} className="shrink-0">
                {status === 'pasting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Clipboard className="mr-2 h-4 w-4" aria-hidden="true" />}
                Paste
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Codes are short-lived and one-time. SyncSenta stores only a cryptographic hash, not the code itself.</p>
          </div>
          <Button type="submit" disabled={!isValidLength || status === 'linking'} className="w-full sm:w-auto">
            {status === 'linking' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />}
            {status === 'linking' ? 'Verifying link…' : 'Verify and connect'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
