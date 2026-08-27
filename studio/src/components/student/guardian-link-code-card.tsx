'use client';

import { useState } from 'react';
import { Check, Clipboard, Link2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

export function GuardianLinkCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'creating' | 'copied' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function createCode() {
    setStatus('creating');
    setMessage(null);
    const { data, error } = await (supabase as any).rpc('create_student_link_code');
    if (error) {
      setStatus('error');
      setMessage('We could not create a guardian code. Please sign in again and try once more.');
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) as { code?: string; expires_at?: string } | undefined;
    if (!row?.code || !row.expires_at) {
      setStatus('error');
      setMessage('The code service returned an incomplete response. No code was shown.');
      return;
    }
    setCode(row.code);
    setExpiresAt(row.expires_at);
    setStatus('idle');
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setStatus('copied');
      setMessage('Code copied. Share it only with the parent or guardian you choose.');
    } catch {
      setStatus('error');
      setMessage('Copy was not permitted. You can select and copy the code manually.');
    }
  }

  return (
    <Card className="border-sky-200 bg-sky-50/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-950"><Link2 className="h-5 w-5" aria-hidden="true" />Share with a parent or guardian</CardTitle>
        <CardDescription className="text-sky-900/80">Create a one-time code only when you are ready to connect someone. The code expires after 15 minutes and is not stored in readable form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && <Alert variant={status === 'error' ? 'destructive' : 'default'}><AlertDescription>{message}</AlertDescription></Alert>}
        {code ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white p-3"><ShieldCheck className="h-5 w-5 text-sky-700" aria-hidden="true" /><code className="flex-1 break-all text-lg font-semibold tracking-[0.18em] text-sky-950">{code}</code></div>
            <p className="text-xs text-sky-900/75">Expires {expiresAt ? new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'soon'} local time. Creating a new code revokes this one.</p>
            <div className="flex flex-wrap gap-2"><Button type="button" onClick={copyCode}><Clipboard className="mr-2 h-4 w-4" aria-hidden="true" />{status === 'copied' ? 'Copied' : 'Copy code'}</Button><Button type="button" variant="outline" onClick={createCode}><XCircle className="mr-2 h-4 w-4" aria-hidden="true" />Create new code</Button></div>
          </div>
        ) : (
          <Button type="button" onClick={createCode} disabled={status === 'creating'}>{status === 'creating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="mr-2 h-4 w-4" aria-hidden="true" />}Create guardian code</Button>
        )}
      </CardContent>
    </Card>
  );
}
