import type { Metadata } from "next";
import { StoryClient } from "@/components/story/StoryClient";

export const metadata: Metadata = { title: "Storyteller" };

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const site = typeof params.site === "string" ? params.site : undefined;
  const state = typeof params.state === "string" ? params.state : undefined;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl text-maroon-deep sm:text-4xl">Storyteller</h1>
        <p className="mt-2 text-ink/70">
          Name a monument, village, craft cluster, or sacred place and Gemini will write its story
          — streamed to your screen as it is composed.
        </p>
      </div>
      <StoryClient initialSite={site} initialState={state} />
    </div>
  );
}
