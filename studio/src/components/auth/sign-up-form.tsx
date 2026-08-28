/**
 * Sign Up Form — no Card wrapper, tight spacing, Google first
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  if (value === 'teacher' || value === 'parent') return value;
  if (value === 'head') return 'admin';
  return 'student';
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signInWithGoogle } = useAuth();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: roleFromQuery(searchParams.get('role')) as SignupRole,
    grade: '',
    schoolId: '',
    schoolName: '',
    homeLearning: false,
    classroomId: '',
    className: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const role = roleFromQuery(searchParams.get('role'));
    setFormData((f) => ({ ...f, role }));
  }, [searchParams]);

  // Load school directory
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('schools').select('id,name,county').eq('status', 'active').order('name').limit(200);
      if (!cancelled) setSchools((data ?? []) as SchoolOption[]);
    })();
    return () => { cancelled = true; };
  }, []);

  // Load classes when school changes
  useEffect(() => {
    let cancelled = false;
    if (!formData.schoolId) { setClasses([]); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from('school_classes').select('id,name,grade')
        .eq('school_id', formData.schoolId).eq('status', 'active')
        .order('grade').order('name').limit(100);
      if (!cancelled) setClasses((data ?? []) as ClassOption[]);
    })();
    return () => { cancelled = true; };
  }, [formData.schoolId]);

  const set = (key: string, val: any) => setFormData((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role,
        grade: formData.role === 'student' ? formData.grade : null,
        school_id: formData.schoolId || null,
        classroom_id: formData.classroomId || null,
        school_name: formData.schoolName || null,
        studentPlacement: formData.role === 'student' && formData.schoolId && formData.classroomId ? {
          schoolId: formData.schoolId,
          schoolName: formData.schoolName,
          classroomId: formData.classroomId,
          className: formData.className,
        } : undefined,
        language_preference: 'mixed',
        subscription_tier: 'free',
        subscription_status: 'active',
      });
      if (formData.role === 'student' && formData.grade && typeof window !== 'undefined') {
        const level = deriveLevelFromGrade(formData.grade);
        window.sessionStorage.setItem('learningJourney.grade', formData.grade);
        window.localStorage.setItem('learningJourney.grade', formData.grade);
        if (level) {
          window.sessionStorage.setItem('learningJourney.level', level);
          window.localStorage.setItem('learningJourney.level', level);
        }
      }
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
      const next = `/auth/onboarding?role=${encodeURIComponent(formData.role)}`;
      await signInWithGoogle({ next, flow: 'signup' });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Google first */}
      <Button type="button" variant="outline" className="w-full h-11 gap-2 font-medium" onClick={handleGoogleSignIn} disabled={loading}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selector — first so context is set early */}
        <div className="space-y-1.5">
          <Label htmlFor="role">I am a…</Label>
          <Select value={formData.role} onValueChange={(v: any) => set('role', v)} disabled={loading}>
            <SelectTrigger id="role" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent or Guardian</SelectItem>
              <SelectItem value="admin">Head of School</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" type="text" placeholder="Jane Wanjiru" value={formData.fullName}
            onChange={(e) => set('fullName', e.target.value)} required disabled={loading} className="h-11" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={formData.email}
            onChange={(e) => set('email', e.target.value)} required disabled={loading} autoComplete="email" className="h-11" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
              value={formData.password} onChange={(e) => set('password', e.target.value)}
              required disabled={loading} minLength={8} autoComplete="new-password" className="h-11 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
              value={formData.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)}
              required disabled={loading} className="h-11 pr-10" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Student-specific fields */}
        {formData.role === 'student' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade</Label>
              <Select value={formData.grade} onValueChange={(v) => set('grade', v)} disabled={loading}>
                <SelectTrigger id="grade" className="h-11"><SelectValue placeholder="Select your grade" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9].map((g) => (
                    <SelectItem key={g} value={`Grade ${g}`}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="school">School <span className="text-muted-foreground text-xs">(optional)</span></Label>
              {schools.length > 0 ? (
                <Select value={formData.homeLearning ? 'home-learning' : formData.schoolId}
                  onValueChange={(v) => {
                    if (v === 'home-learning') { set('schoolId', ''); set('schoolName', ''); set('homeLearning', true); set('classroomId', ''); set('className', ''); return; }
                    const s = schools.find((x) => x.id === v);
                    setFormData((f) => ({ ...f, schoolId: v, schoolName: s?.name ?? '', homeLearning: false, classroomId: '', className: '' }));
                  }} disabled={loading}>
                  <SelectTrigger id="school" className="h-11"><SelectValue placeholder="Choose school or home learning" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home-learning">I learn at home</SelectItem>
                    {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.county ? ` — ${s.county}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="school" type="text" placeholder="Your school name (optional)" value={formData.schoolName}
                  onChange={(e) => setFormData((f) => ({ ...f, schoolName: e.target.value, schoolId: '', homeLearning: false }))}
                  disabled={loading} className="h-11" />
              )}
            </div>

            {formData.schoolId && (
              <div className="space-y-1.5">
                <Label htmlFor="classroom">Class <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Select value={formData.classroomId}
                  onValueChange={(v) => { const c = classes.find((x) => x.id === v); setFormData((f) => ({ ...f, classroomId: v, className: c?.name ?? '' })); }}
                  disabled={loading || !formData.grade}>
                  <SelectTrigger id="classroom" className="h-11"><SelectValue placeholder="Select your class" /></SelectTrigger>
                  <SelectContent>
                    {classes.filter((c) => !formData.grade || c.grade === formData.grade).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* Admin — school picker or free text */}
        {formData.role === 'admin' && (
          <div className="space-y-1.5">
            <Label htmlFor="school">School <span className="text-muted-foreground text-xs">(optional)</span></Label>
            {schools.length > 0 ? (
              <Select value={formData.schoolId} onValueChange={(v) => { const s = schools.find((x) => x.id === v); setFormData((f) => ({ ...f, schoolId: v, schoolName: s?.name ?? '' })); }} disabled={loading}>
                <SelectTrigger id="school" className="h-11"><SelectValue placeholder="Select your school" /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.county ? ` — ${s.county}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input id="school" type="text" placeholder="Your school name (optional)" value={formData.schoolName}
                onChange={(e) => setFormData((f) => ({ ...f, schoolName: e.target.value, schoolId: '' }))}
                disabled={loading} className="h-11" />
            )}
          </div>
        )}

        {/* Teacher / parent — free text school */}
        {(formData.role === 'teacher' || formData.role === 'parent') && (
          <div className="space-y-1.5">
            <Label htmlFor="schoolName">School Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="schoolName" type="text" placeholder="Your school name" value={formData.schoolName}
              onChange={(e) => set('schoolName', e.target.value)} disabled={loading} className="h-11" />
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/auth/signin" className="font-medium text-primary hover:underline">Sign in</a>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
