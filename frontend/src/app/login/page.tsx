import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from } = await searchParams;
  const redirectTo = from && from.startsWith("/") ? from : "/";

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm redirectTo={redirectTo} />
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
