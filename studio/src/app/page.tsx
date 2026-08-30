"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Users,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const roles = [
  {
    title: "Students",
    demoRole: "student",
    description: "Learn at your pace with CBC-aligned guidance and feedback.",
    icon: GraduationCap,
    href: "/auth/signup?role=student",
    redirect: "/student",
    grade: "Grade 5",
    level: "upper-primary",
    items: [
      "Personalised learning journeys",
      "Practice and feedback matched to your level",
      "Ask SyncSenta for guided help",
    ],
  },
  {
    title: "Teachers",
    demoRole: "teacher",
    description: "Prepare, assess, and support learners with less administration.",
    icon: Users,
    href: "/auth/signup?role=teacher",
    redirect: "/teacher/dashboard",
    items: [
      "Schemes and lesson plans",
      "Assessment and markbook workflows",
      "Evidence-led learner support",
    ],
  },
  {
    title: "Heads of School",
    demoRole: "head",
    description: "See school-level progress and the decisions that need attention.",
    icon: BarChart3,
    href: "/auth/signup?role=head",
    redirect: "/teacher/dashboard",
    items: [
      "Class and school aggregates",
      "Attendance and progress signals",
      "Human-reviewed exceptions",
    ],
  },
  {
    title: "Parents and Guardians",
    demoRole: "parent",
    description: "Stay connected to a learner's progress without information overload.",
    icon: HeartHandshake,
    href: "/auth/signup?role=parent",
    redirect: "/dashboard",
    items: [
      "Weekly learning summaries",
      "Teacher evidence and next steps",
      "Consent and visibility controls",
    ],
  },
];

export default function HomePage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleContinue = async (role: typeof roles[0]) => {
    setLoadingRole(role.demoRole);
    setDemoError(null);

    // --- Non-demo (production) mode ---
    if (!DEMO_MODE) {
      try {
        // Check if there is already an active Supabase session.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is already signed in — go straight to their dashboard.
          router.push(role.redirect);
        } else {
          // Not signed in — send them to login, preserving the destination.
          const loginUrl = `/login?next=${encodeURIComponent(role.redirect)}`;
          router.push(loginUrl);
        }
      } catch {
        setDemoError("Could not check session. Please try again.");
      } finally {
        setLoadingRole(null);
      }
      return;
    }

    // --- Demo mode ---
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.demoRole }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDemoError(data.error || "Demo login failed. Please try again.");
        return;
      }

      // Establish the session in the Supabase browser client.
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Seed CBC context for student so journey wizard is skipped.
      if (data.grade && typeof window !== "undefined") {
        sessionStorage.setItem("learningJourney.grade", data.grade);
        localStorage.setItem("learningJourney.grade", data.grade);
        if (data.level) {
          sessionStorage.setItem("learningJourney.level", data.level);
          localStorage.setItem("learningJourney.level", data.level);
        }
      }

      router.push(data.redirect ?? role.redirect);
    } catch {
      setDemoError("Could not connect. Please try again.");
    } finally {
      setLoadingRole(null);
    }
  };

  const buttonLabel = (role: typeof roles[0]) => {
    const name =
      role.title === "Parents and Guardians"
        ? "Parent/Guardian"
        : role.title === "Heads of School"
        ? "Head"
        : role.title;
    return DEMO_MODE ? `Try as ${name}` : `Continue as ${name}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="SyncSenta home">
            <Image src="/assets/LOGO.png" alt="" width={40} height={40} className="rounded-xl" priority />
            <span className="font-headline text-xl font-bold tracking-tight text-primary">SyncSenta</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Primary navigation">
            <Link href="/products" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
              Explore
            </Link>
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Built for Kenyan classrooms
            </div>
            <h1 className="max-w-3xl font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
              One learning system for the whole school community.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              SyncSenta connects students, teachers, school leaders, and families around CBC-aligned learning
              evidence—while keeping people in control of important decisions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => router.push("/signup")} className="min-h-12 sm:w-auto">
                Choose your role <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" asChild className="min-h-12 sm:w-auto">
                <Link href="/products">See how it works</Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>No facial identification or biometric profiling of children.</span>
              </div>
              <div className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Designed for classrooms with intermittent connectivity.</span>
              </div>
            </div>
          </div>

          {/* Preview card */}
          <div className="relative flex items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
            <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative w-full max-w-sm space-y-4">
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Today's learning path</span>
                  <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                      <span>Mathematics</span><span>In progress</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 w-3/5 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                      <span>Environmental Activities</span><span>Next</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 w-2/5 rounded-full bg-accent" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Teacher feedback</p>
                  <p className="mt-2 text-sm font-semibold">Ready to review</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Family update</p>
                  <p className="mt-2 text-sm font-semibold">Consent-aware</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role cards */}
        <section className="border-y border-border/70 bg-secondary/30" aria-labelledby="role-heading">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Start with your role</p>
              <h2 id="role-heading" className="mt-3 font-headline text-3xl font-bold text-primary sm:text-4xl">
                The right view for the work you do.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each role sees only the information and actions needed for its responsibilities.
              </p>
              {DEMO_MODE && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  🧪 Demo mode — click any role to explore as a test user
                </p>
              )}
              {demoError && (
                <p className="mt-3 text-sm text-destructive">{demoError}</p>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isLoading = loadingRole === role.demoRole;
                return (
                  <Card key={role.title} className="flex h-full flex-col border-border bg-background">
                    <CardHeader>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-xl">{role.title}</CardTitle>
                      <p className="text-sm leading-6 text-muted-foreground">{role.description}</p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {role.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-primary" aria-hidden="true">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        className="mt-6 w-full"
                        disabled={isLoading || loadingRole !== null}
                        onClick={() => handleContinue(role)}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                          </>
                        ) : (
                          <>
                            {buttonLabel(role)}
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 SyncSenta. CBC-aligned learning with human oversight.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-foreground hover:underline">Privacy and terms</Link>
          <Link href="https://forms.gle/3vQhgtJbnEaGD6xV8" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
            Provide feedback
          </Link>
        </div>
      </footer>
    </div>
  );
}
