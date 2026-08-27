/**
 * Sign Up Form Component
 * 
 * User registration form with email/password and Google OAuth.
 * Collects basic profile information during signup.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Map a CBC grade string (e.g. "Grade 5") to the level id used by
 * /student/journey. Returns null for unrecognised inputs.
 * Keep in sync with CBC_LEVELS in src/app/student/journey/page.tsx.
 */
function deriveLevelFromGrade(grade: string): string | null {
  if (grade === 'PP1' || grade === 'PP2') return 'pre-primary';
  const n = parseInt(grade.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  if (n >= 1 && n <= 3) return 'lower-primary';
  if (n >= 4 && n <= 6) return 'upper-primary';
  if (n >= 7 && n <= 9) return 'junior-secondary';
  if (n >= 10 && n <= 12) return 'senior-secondary';
  return null;
}

type SignupRole = 'student' | 'teacher' | 'parent' | 'admin';

type SchoolOption = { id: string; name: string; county: string | null };
type ClassOption = { id: string; name: string; grade: string };

function roleFromQuery(value: string | null): SignupRole {
  if (value === 'teacher' || value === 'parent' || value === 'head') return value === 'head' ? 'admin' : value;
  return 'student';
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signInWithGoogle } = useAuth();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: roleFromQuery(searchParams.get('role')),
    grade: '',
    schoolId: '',
    schoolName: '',
    classroomId: '',
    className: '',
  });

  useEffect(() => {
    const role = roleFromQuery(searchParams.get('role'));
    setFormData((current) => ({ ...current, role }));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function loadSchools() {
      const { data, error } = await (supabase as any)
        .from('schools')
        .select('id,name,county')
        .eq('status', 'active')
        .order('name')
        .limit(200);
      if (cancelled) return;
      if (error) setCatalogError('School directory is temporarily unavailable. Please try again later.');
      else setSchools((data ?? []) as SchoolOption[]);
    }
    loadSchools();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadClasses() {
      if (!formData.schoolId) { setClasses([]); return; }
      const { data, error } = await (supabase as any)
        .from('school_classes')
        .select('id,name,grade')
        .eq('school_id', formData.schoolId)
        .eq('status', 'active')
        .order('grade')
        .order('name')
        .limit(100);
      if (cancelled) return;
      if (error) setCatalogError('Class directory is temporarily unavailable.');
      else setClasses((data ?? []) as ClassOption[]);
    }
    loadClasses();
    return () => { cancelled = true; };
  }, [formData.schoolId]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.role === 'student' && (!formData.schoolId || !formData.classroomId)) {
      setError('Please select your school and class');
      return;
    }

    if (formData.role === 'admin' && !formData.schoolId) {
      setError('Heads of School must select their school');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role,
        grade: formData.role === 'student' ? formData.grade : null,
        school_id: formData.schoolId || null,
        classroom_id: formData.classroomId || null,
        school_name: formData.schoolName || null,
        studentPlacement: formData.role === 'student' ? {
          schoolId: formData.schoolId,
          schoolName: formData.schoolName,
          classroomId: formData.classroomId,
          className: formData.className,
        } : undefined,
        language_preference: 'mixed',
        subscription_tier: 'free',
        subscription_status: 'active',
      });

      // Seed the journey wizard from the signup choice so brand-new students
      // aren't asked their grade twice. The wizard reads these on mount and
      // will skip straight to the subject step. sessionStorage (not localStorage)
      // matches the rest of the journey flow.
      if (formData.role === 'student' && formData.grade && typeof window !== 'undefined') {
        const level = deriveLevelFromGrade(formData.grade);
        window.sessionStorage.setItem('learningJourney.grade', formData.grade);
        window.localStorage.setItem('learningJourney.grade', formData.grade);
        if (level) {
          window.sessionStorage.setItem('learningJourney.level', level);
          window.localStorage.setItem('learningJourney.level', level);
        }
      }

      // Students continue into their personalized workspace with the saved
      // CBC context; school staff and guardians use the role-aware dashboard.
      router.push(formData.role === 'student' ? '/student' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md border-border/80 shadow-[0_18px_45px_hsl(174_30%_16%/0.1)]">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join mwalimu_ai to start your learning journey
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
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {catalogError && (
            <p className="text-sm text-destructive" role="alert">{catalogError}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="parent">Parent or Guardian</SelectItem>
                <SelectItem value="admin">Head of School</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'student' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select
                  value={formData.schoolId}
                  onValueChange={(value) => {
                    const school = schools.find((item) => item.id === value);
                    setFormData({ ...formData, schoolId: value, schoolName: school?.name ?? '', classroomId: '', className: '' });
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="school"><SelectValue placeholder="Select your school" /></SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => <SelectItem key={school.id} value={school.id}>{school.name}{school.county ? ` — ${school.county}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value, classroomId: '', className: '' })}
                disabled={loading}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select your grade" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((grade) => (
                    <SelectItem key={grade} value={`Grade ${grade}`}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classroom">Class</Label>
                <Select
                  value={formData.classroomId}
                  onValueChange={(value) => {
                    const classroom = classes.find((item) => item.id === value);
                    setFormData({ ...formData, classroomId: value, className: classroom?.name ?? '' });
                  }}
                  disabled={loading || !formData.schoolId || !formData.grade}
                >
                  <SelectTrigger id="classroom"><SelectValue placeholder="Select your class" /></SelectTrigger>
                  <SelectContent>
                    {classes.filter((item) => item.grade === formData.grade).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Select
                value={formData.schoolId}
                onValueChange={(value) => {
                  const school = schools.find((item) => item.id === value);
                  setFormData({ ...formData, schoolId: value, schoolName: school?.name ?? '' });
                }}
                disabled={loading}
              >
                <SelectTrigger id="school"><SelectValue placeholder="Select your school" /></SelectTrigger>
                <SelectContent>
                  {schools.map((school) => <SelectItem key={school.id} value={school.id}>{school.name}{school.county ? ` — ${school.county}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.role !== 'student' && formData.role !== 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name (Optional)</Label>
            <Input
              id="schoolName"
              type="text"
              placeholder="Your school name"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              disabled={loading}
            />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </Button>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/auth/signin" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
