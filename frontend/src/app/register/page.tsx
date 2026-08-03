import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
