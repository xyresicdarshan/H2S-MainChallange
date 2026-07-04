import Link from "next/link";

const FEATURES = [
  {
    href: "/discover",
    title: "Personalized discoveries",
    description:
      "Tell Gemini your interests and travel style; it curates heritage sites, crafts, and living traditions that fit you.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7 text-maroon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="9" />
        <polygon points="12,6.5 14,12 12,17.5 10,12" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/hidden-gems",
    title: "Hidden gems",
    description:
      "Lesser-known places in any state, with cultural context, directions, and an honest local tip for each.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7 text-maroon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M7 4h10l4 5-9 11L3 9l4-5z" />
        <path d="M3 9h18M12 20 8.5 9l3.5-5 3.5 5L12 20" />
      </svg>
    ),
  },
  {
    href: "/story",
    title: "AI storyteller",
    description:
      "Name any monument or place and watch Gemini write its history, legends, and living culture in real time.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7 text-maroon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 5c2.5-1.2 5.5-1.2 8 0v14c-2.5-1.2-5.5-1.2-8 0V5z" />
        <path d="M20 5c-2.5-1.2-5.5-1.2-8 0v14c2.5-1.2 5.5-1.2 8 0V5z" />
      </svg>
    ),
  },
  {
    href: "/events",
    title: "Festival finder",
    description:
      "Pick a month and region to see the festivals and cultural events worth planning a trip around.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7 text-maroon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 3c1.8 2 2.7 3.6 2.7 5a2.7 2.7 0 1 1-5.4 0c0-1.4.9-3 2.7-5z" />
        <path d="M5 15h14c-.6 3.2-3.4 5.5-7 5.5S5.6 18.2 5 15z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: "Tell it your interests",
    description:
      "Pick what draws you to India — temples, textiles, food, folk music — plus a region or travel style if you like.",
  },
  {
    title: "Gemini generates live",
    description:
      "Every recommendation, gem, festival listing, and story is produced by Google Gemini at the moment you ask.",
  },
  {
    title: "Save what you love",
    description:
      "Keep your favourite finds and stories in your own collection, ready when you plan the journey.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-ink/10 bg-parchment px-6 py-14 sm:px-12 sm:py-20">
        <svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 text-maroon/10 sm:h-72 sm:w-72"
          fill="currentColor"
        >
          <circle cx="32" cy="9" r="4" />
          <rect x="27" y="15" width="10" height="8" rx="1" />
          <rect x="20" y="25" width="24" height="8" rx="1" />
          <rect x="13" y="35" width="38" height="8" rx="1" />
          <rect x="6" y="45" width="52" height="8" rx="1" />
        </svg>
        <div className="relative max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-saffron">
            <span lang="hi">विरासत</span> · Virasat
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-maroon-deep sm:text-5xl">
            Discover India&rsquo;s living heritage
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink/80">
            A cultural guide powered by Google Gemini. Personalized heritage recommendations,
            hidden gems, festival calendars, and place stories — all generated live, for you, the
            moment you ask.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/register" className="btn-primary">
              Create your free account
            </Link>
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl text-maroon-deep sm:text-3xl">
          Four ways to explore
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="card group flex flex-col gap-3 transition-colors hover:border-maroon/30"
            >
              {feature.icon}
              <h3 className="text-lg text-maroon-deep group-hover:text-maroon">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-ink/70">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl text-maroon-deep sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card">
              <p aria-hidden="true" className="font-display text-3xl text-saffron">
                {index + 1}
              </p>
              <h3 className="mt-2 text-lg text-maroon-deep">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-label="Transparency"
        className="rounded-2xl border border-saffron/30 bg-parchment px-6 py-5"
      >
        <p className="text-sm leading-relaxed text-ink/80">
          <span className="font-medium text-maroon-deep">Honest by design:</span> every result on
          Virasat is generated in real time by Google Gemini — nothing is pre-written or canned. AI
          can make mistakes, so verify important details before you travel.
        </p>
      </section>
    </div>
  );
}
