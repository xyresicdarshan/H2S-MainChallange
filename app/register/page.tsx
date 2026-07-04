import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl text-maroon-deep">Create your account</h1>
        <p className="mt-2 text-ink/70">
          A free account lets you save discoveries and keep your interests on file.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-maroon underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
