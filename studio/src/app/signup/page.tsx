import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, School, HeartHandshake } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Choose Your Role</CardTitle>
          <CardDescription>Choose how you will use Syncsenta. You can change your learning or teaching details later.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button asChild size="lg">
            <Link href="/auth/signup?role=student">
              <GraduationCap className="mr-2 h-5 w-5" />
              Continue as Student
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/signup?role=teacher">
              <Users className="mr-2 h-5 w-5" />
              Continue as Teacher
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/signup?role=head">
              <School className="mr-2 h-5 w-5" />
              Continue as Head of School
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/signup?role=parent">
              <HeartHandshake className="mr-2 h-5 w-5" />
              Continue as Parent or Guardian
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
