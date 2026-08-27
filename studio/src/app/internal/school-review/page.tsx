'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type RequestItem = { id: string; contact_name: string; contact_email: string; school_name: string; county: string; school_code: string | null; school_type: string; classes: unknown; created_at: string };

export default function SchoolReviewPage() {
  const [token, setToken] = useState('');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setMessage(null);
    try {
      const response = await fetch('/api/internal/schools/onboarding', { headers: { 'x-syncsenta-school-review-token': token } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load requests.');
      setRequests(result.requests ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load requests.'); }
    finally { setLoading(false); }
  };

  const decide = async (requestId: string, action: 'approve' | 'reject') => {
    setLoading(true); setMessage(null);
    try {
      const response = await fetch('/api/internal/schools/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-syncsenta-school-review-token': token }, body: JSON.stringify({ requestId, action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update request.');
      setRequests((items) => items.filter((item) => item.id !== requestId));
      setMessage(action === 'approve' ? 'School published to the active directory.' : 'Registration rejected.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update request.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="education-shell flex justify-center p-5">
      <Card className="w-full max-w-4xl border-border/80 shadow-[0_18px_45px_hsl(174_30%_16%/0.1)]">
        <CardHeader><CardTitle>SyncSenta school directory review</CardTitle><p className="text-sm text-muted-foreground">Internal operator surface. The review token stays in memory only. Pending requests are not visible to students.</p></CardHeader>
        <CardContent className="space-y-5">
          {message && <Alert variant={message.includes('published') || message.includes('rejected') ? 'default' : 'destructive'}>{message.includes('published') || message.includes('rejected') ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}<AlertDescription>{message}</AlertDescription></Alert>}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><div className="flex-1 space-y-2"><Label htmlFor="review-token">Review token</Label><Input id="review-token" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Enter the operator review token" /></div><Button onClick={load} disabled={!token || loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</> : 'Load pending requests'}</Button></div>
          <div className="space-y-3">{requests.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests loaded.</p> : requests.map((item) => <article key={item.id} className="border-b py-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h2 className="font-semibold">{item.school_name}</h2><p className="text-sm text-muted-foreground">{item.county} · {item.school_type} · {item.school_code || 'No school code provided'}</p><p className="text-sm">Contact: {item.contact_name} ({item.contact_email})</p><p className="text-sm">Classes/grades: {Array.isArray(item.classes) ? item.classes.join(', ') : 'Not provided'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => decide(item.id, 'reject')} disabled={loading}>Reject</Button><Button onClick={() => decide(item.id, 'approve')} disabled={loading}>Approve</Button></div></div></article>)}</div>
        </CardContent>
      </Card>
    </main>
  );
}
