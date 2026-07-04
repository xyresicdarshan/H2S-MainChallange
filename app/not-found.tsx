import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl text-maroon-deep">Page not found</h1>
      <p className="mt-4 text-ink/70">
        The page you were looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to the home page
      </Link>
    </div>
  );
}
