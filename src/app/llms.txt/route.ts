/**
 * /llms.txt: a plain-language summary of the club for AI assistants and
 * answer engines (GEO), following the llms.txt convention. Built from the
 * same config as the pages, so facts, prices and hours never drift.
 */
import { CONTACT } from "@/config/content";
import { faqItems } from "@/config/home";
import { loadSiteFacts } from "@/engine/siteFacts";
import { SITE } from "@/config/site";
import { CLOSE_HOUR, OPEN_HOUR, RENTALS, SPORTS, courtsOf, sportTitle } from "@/engine/venue";

/** Rebuilt at most every 5 minutes, so prices and rules follow the admin settings. */
export const revalidate = 300;

const toman = (n: number) => `${n.toLocaleString("en-US")} toman`;

export async function GET() {
  const facts = await loadSiteFacts();
  const { rules, pricing } = facts;
  const u = SITE.url;
  const lines: string[] = [
    `# ${SITE.latinName} (${SITE.name})`,
    "",
    `> ${SITE.latinName} is a padel and beach sports club in ${SITE.city === "تهران" ? "Tehran" : SITE.city}, Iran, with online court booking. ${SITE.seoDescription}`,
    "",
    "## Key facts",
    "",
    ...SPORTS.map((s) => `- ${s.latin}${s.games.length > 1 ? ` (${s.games.map((g) => g.latin).join(", ")})` : ""}: ${courtsOf(s.id).length} ${s.indoor ? "indoor" : "outdoor"} courts. Persian: ${sportTitle(s)}.`),
    `- Open every day, ${String(OPEN_HOUR).padStart(2, "0")}:00 to ${CLOSE_HOUR === 24 ? "24:00 (midnight)" : `${CLOSE_HOUR}:00`}. Online booking is open around the clock.`,
    "- Every session is one hour and starts on the hour.",
    `- Bookable up to ${rules.maxDaysAhead} days ahead; weekly repeat bookings are possible.`,
    "- Payment: Iranian bank cards through Shaparak gateways, or the club wallet.",
    `- Courts are held for ${rules.holdMinutes} minutes while the player is on the bank page.`,
    ...(CONTACT.address ? [`- Address: ${CONTACT.address}`] : []),
    ...(CONTACT.phone ? [`- Phone: ${CONTACT.phone}`] : []),
    `- Instagram: https://instagram.com/${CONTACT.instagram}`,
    "",
    "## Prices (per one-hour session)",
    "",
    ...SPORTS.flatMap((s) => (pricing.bands[s.id] ?? []).map((b) => `- ${s.latin}, ${String(b.from).padStart(2, "0")}:00–${String(b.to).padStart(2, "0")}:00: ${toman(b.price)}`)),
    ...RENTALS.map((r) => `- Rental: ${r.name} — ${toman(pricing.rentals[r.id] ?? r.price)} each, per session (up to ${r.maxPerBooking})`),
    "",
    "## Cancellation and refunds",
    "",
    ...[...rules.cancelRules].sort((a, b) => b.hours - a.hours).map((r, i, all) =>
      r.hours ? `- Cancelled ${r.hours}+ hours before the start: ${r.percent}% back to the club wallet` : `- Less than ${all[i - 1]?.hours ?? 0} hours before the start: ${r.percent ? `${r.percent}% back` : "no refund"}`,
    ),
    "- If the club closes a court, the booking is cancelled and fully refunded to the wallet.",
    "",
    "## How to book",
    "",
    `1. Open ${u}/sport and choose padel, beach tennis or beach volley.`,
    "2. Pick a day and an hour, then a free court on the court map.",
    "3. Sign in with a mobile number and an SMS code (an account is created on the spot).",
    "4. Pay by bank card or wallet and get a tracking code.",
    "",
    "## Pages",
    "",
    `- [Home](${u}/): overview, today's free sessions, prices, coaches, FAQ`,
    `- [Choose a sport](${u}/sport)`,
    ...SPORTS.map((s) => `- [Book ${s.latin}](${u}/book/${s.id})`),
    `- [Coaches](${u}/coaches): coach profiles, teaching hours and prices`,
    `- [Terms](${u}/terms): booking, cancellation and wallet rules`,
    `- [Privacy](${u}/privacy)`,
    "",
    "## FAQ (Persian, as shown on the site)",
    "",
    ...faqItems(facts).flatMap(([q, a]) => [`### ${q}`, "", a, ""]),
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
