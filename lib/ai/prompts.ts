import type {
  EventsRequest,
  HiddenGemsRequest,
  RecommendationsRequest,
  StoryRequest,
} from "@/lib/types";

/**
 * Prompt engineering for every Gemini feature. The system prompts pin the
 * model to verifiable, respectful cultural content; the builders fold the
 * user's validated request fields into a tight task description.
 */

export const CULTURAL_EXPERT_SYSTEM = `You are the cultural intelligence behind Virasat, a discovery platform for Indian cultural experiences. You are an expert on Indian culture, heritage, and regional travel: monuments and living heritage, festivals and fairs, classical and folk performing arts, crafts and textiles, regional cuisines, sacred sites, and rural traditions across every state and union territory.

Non-negotiable rules:
1. Name ONLY real, verifiable places, festivals, crafts, monuments, and traditions. Never invent an establishment, event, village, or attraction. If you are uncertain whether something exists or is accurately described, choose a well-documented alternative instead.
2. Be accurate about religious customs and ritual etiquette. Mention entry restrictions, dress expectations, or photography limits where they genuinely apply; never misstate them.
3. Be respectful of local communities. Present them as hosts and custodians of their traditions, never as spectacles, and avoid stereotypes.
4. Write vivid but strictly factual descriptions: concrete and sensory, never exaggerated, and never embellished with invented details.
5. Use commonly recognized present-day place names and current official state names.

Respond only in the exact JSON structure requested, with every field filled meaningfully.`;

export const STORY_SYSTEM = `You are Virasat's storyteller: a knowledgeable narrator of Indian heritage who writes engaging, factually grounded cultural narratives for curious travelers.

Rules:
1. Ground every claim in documented history, geography, and living tradition. Never invent dates, rulers, rituals, or architectural details. When you recount folklore, clearly frame it as legend rather than fact.
2. Be respectful of local communities and accurate about religious customs.
3. Write in markdown-free flowing prose: no headings, bullet points, asterisks, numbered lists, or bold markers of any kind. Use short paragraphs separated by blank lines.
4. Aim for 450 to 650 words: open by placing the reader at the site, build a rich middle grounded in history and culture, and close by connecting the past to what a visitor experiences today.
5. If the requested name does not correspond to any real, documented place or tradition in India, say so plainly in one short paragraph instead of inventing a story.`;

export function buildRecommendationsPrompt(req: RecommendationsRequest): string {
  const scope = req.region
    ? `within ${req.region}, India`
    : "from anywhere across India";
  const style = req.travelStyle
    ? `Their travel style is "${req.travelStyle}" — let it shape the kind of place, pace, and practical framing you choose.`
    : "No travel style was specified, so keep the set broadly accessible.";

  return `Recommend exactly 6 cultural experiences ${scope} for a traveler whose stated interests are: ${req.interests.join(", ")}.

Requirements:
- Prefer places of authentic cultural depth — living traditions, working artisan communities, regional festivals, layered historical sites — over generic tourist traps or overexposed landmarks.
- Make the 6 picks genuinely diverse: different ${req.region ? "districts and settings within the region" : "states and regions"}, and a mix of categories (heritage sites, craft clusters, performance traditions, food cultures, sacred spaces, rural life) weighted toward the stated interests.
- ${style}
- In whyRecommended, tie each pick explicitly back to the traveler's stated interests.
- In bestTimeToVisit, give the season or months with a brief reason (weather, festival season, harvest, craft cycles).
- Keep description to 2-3 vivid, factual sentences; make culturalSignificance substantive, not generic praise.`;
}

export function buildHiddenGemsPrompt(req: HiddenGemsRequest): string {
  const focus =
    req.interests && req.interests.length > 0
      ? `Lean the selection toward these interests where authentic options exist: ${req.interests.join(", ")}.`
      : "Cover a spread of cultural facets: craft, faith, architecture, food, and rural life.";

  return `List exactly 5 genuinely lesser-known cultural places in ${req.state}, India.

Requirements:
- Explicitly exclude famous, heavily touristed places — nothing that appears on typical "top attractions" lists for ${req.state}, and no major landmarks, capital-city icons, or UNESCO headline sites.
- Every pick must still be real and verifiable: a documented village, temple, craft cluster, stepwell, fort, weaving town, sacred grove, or similar that locals know but mainstream itineraries overlook.
- ${focus}
- In culturalContext, explain the tradition or history that makes the place matter to its community.
- In howToReach, name the nearest well-known town or railhead and the practical last leg (road, ferry, trek).
- In localTip, give one authentic, practical local insight — the right hour to arrive, whom to ask for, what to try or buy, or an etiquette point — never a generic platitude.`;
}

export function buildEventsPrompt(req: EventsRequest): string {
  const scope = req.region ? `in ${req.region}, India` : "across India";

  return `List exactly 6 real festivals or recurring cultural events that take place in ${req.month} ${scope}.

Requirements:
- Only include events that genuinely recur in or around ${req.month}. Many Indian festivals follow lunar or regional calendars, so word each timeframe realistically — for example "usually the second week of ${req.month}" or "on Magha Purnima, which typically falls in ${req.month}" — never a fixed calendar date for a specific year unless the date truly is fixed.
- Mix scales: include at least two regional or community-level events alongside better-known festivals, and vary the locations${req.region ? " within the region" : " across different states"}.
- In culturalSignificance, explain what the event means to the community that celebrates it.
- In travelerTips, be practical: how early to plan, crowd and accommodation realities, dress and etiquette expectations, and what a respectful visitor should see, eat, or take part in.`;
}

export function buildStoryPrompt(req: StoryRequest): string {
  const where = req.state ? ` in ${req.state}, India` : " in India";
  const angle = req.theme
    ? `Center the narrative on this theme: "${req.theme}". Let other facets appear only in support of that angle.`
    : "Weave together its history, legends (framed as legends), art, and living culture into one coherent narrative.";

  return `Tell the cultural story of "${req.siteName}"${where}.

${angle}

If the name is ambiguous, choose the most culturally significant, well-documented site or tradition of that name${req.state ? ` in ${req.state}` : ""}. Write 450 to 650 words of plain flowing prose in short paragraphs, with no markdown or list formatting, ending on what the place means to the people who live with it today.`;
}
