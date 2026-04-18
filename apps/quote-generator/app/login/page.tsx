"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMicrosoftSignIn() {
    setError(null);
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/quotes",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start sign-in flow",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Noxe Quotes</CardTitle>
          <CardDescription>
            Use your Noxe Microsoft account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Redirecting..." : "Continue with Microsoft"}
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
