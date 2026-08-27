'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Parent/guardian entry point.
 *
 * This intentionally renders no fabricated learner data. The next integration
 * step is to connect consented guardian-learner relationships from Supabase,
 * then populate the cards through read-only parent APIs.
 */
export default function ParentDashboardPage() {
  return (
    <main className="education-shell min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <Badge variant="secondary">Parent / guardian</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Stay close to learning without taking over
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            This dashboard is the connection point for a learner’s progress,
            teacher communication, voluntary wellbeing check-ins, and consent settings.
            Learner information appears only after a verified relationship is
            connected.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Parent dashboard areas">
          <Card>
            <CardHeader>
              <BookOpen className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Learning progress</CardTitle>
              <CardDescription>Competency progress and recent learning activity.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Connect a learner</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Teacher connection</CardTitle>
              <CardDescription>Messages, assignments, and support requests.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Connect a school</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <HeartHandshake className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Wellbeing support</CardTitle>
              <CardDescription>Voluntary learner check-ins with human support when needed.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Not yet connected</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Privacy and consent</CardTitle>
              <CardDescription>Choose who can view and support information the learner shares.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Review settings</Badge></CardContent>
          </Card>
        </section>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nothing is linked yet</CardTitle>
            <CardDescription>
              The dashboard is ready for the verified guardian–learner connection flow.
              No progress or wellbeing information is shown until consent and identity
              checks are complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">Create or connect an account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/terms">Review privacy and terms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
