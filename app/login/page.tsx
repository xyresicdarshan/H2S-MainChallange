import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl text-maroon-deep">Log in</h1>
        <p className="mt-2 text-ink/70">Welcome back — pick up where you left off.</p>
      </div>
      <div className="rounded-xl border border-saffron/40 bg-parchment px-4 py-3 text-sm text-ink/80">
        <p>
          <span className="font-medium text-maroon-deep">Evaluator access</span> — use the demo
          account: <strong>demo@virasat.app</strong> / <strong>VirasatDemo@2026</strong>
        </p>
      </div>
      <LoginForm next={next} />
      <p className="text-sm text-ink/70">
        New to Virasat?{" "}
        <Link href="/register" className="font-medium text-maroon underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
