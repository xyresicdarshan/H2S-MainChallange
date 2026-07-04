import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/LogoutButton";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/hidden-gems", label: "Hidden Gems" },
  { href: "/story", label: "Storyteller" },
  { href: "/events", label: "Festivals" },
  { href: "/saved", label: "Saved" },
] as const;

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-ink/10 bg-ivory">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-maroon hover:text-maroon-deep"
        >
          Virasat
        </Link>
        {/* flex-wrap drops the nav to its own row on small screens — fully usable without JavaScript. */}
        <nav aria-label="Main" className="order-last w-full md:order-none md:w-auto md:flex-1">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md text-sm font-medium text-ink/80 hover:text-maroon"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-ink/80">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md text-sm font-medium text-ink/80 hover:text-maroon">
                Log in
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2 text-xs">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
