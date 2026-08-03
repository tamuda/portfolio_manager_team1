"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Registration failed.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
