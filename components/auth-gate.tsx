"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/brand-mark";

export function AuthGate({ children }: { children: React.ReactNode }) {
  // Lazy-init so Supabase is never constructed during SSR / prerender.
  // It runs in the browser after hydration.
  const [supabase] = useState(() => getSupabaseBrowser());
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (signedIn) return <>{children}</>;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3"><BrandMark size={36} /></div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in with a magic link. We&apos;ll email you a one-click login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              Magic link sent to <span className="font-medium">{email}</span>. Check your inbox.
            </p>
          ) : (
            <form onSubmit={sendLink} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
