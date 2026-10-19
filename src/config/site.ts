/**
 * Brand and site-wide text for this club. Modules read names, logos,
 * navigation and footer from here, so another club changes this file
 * (plus `venue.ts`, `home.ts`, `content.ts` and `theme.css`) and keeps
 * the modules untouched.
 */

export const SITE = {
  /** Persian brand name used in titles and copy. */
  name: "کی کلاب",
  /** Latin brand name (footer copyright, alt text). */
  latinName: "K Club",
  /** Small caption under the wordmark in the navbar and footer. */
  tagline: "Padel · Beach Club",
  /** Caption under the wordmark in the members' panel. */
  panelTagline: "Members Area",
  /** Default <title> and description for search engines. */
  seoTitle: "کی کلاب | رزرو آنلاین زمین پدل و ساحلی",
  seoDescription:
    "رزرو آنلاین زمین پدل، تنیس ساحلی و والیبال ساحلی در کی کلاب. سانس خالی را ببینید، زمین را انتخاب کنید و آنلاین پرداخت کنید.",
  /** Browser UI colour on phones. */
  themeColor: "#0D0D0E",
  logo: {
    /** Square emblem, transparent background. */
    emblem: "/brand/k-emblem.webp",
    /** Horizontal wordmark, transparent background. */
    wordmark: "/brand/k-wordmark.png",
  },
  /** Name of the in-app wallet, e.g. "کیف پول کی کلاب". */
  walletName: "کیف پول کی کلاب",
};

/** Main navbar links; `match` lists path prefixes that mark the link as current. */
export const NAV_LINKS = [
  { href: "/sport", label: "رزرو زمین", match: ["/sport", "/book"] },
  { href: "/coaches", label: "معرفی مربیان", match: ["/coaches"] },
  { href: "/#how", label: "راهنمای رزرو", match: [] as string[] },
];

/** Locked navbar item for a feature that opens later; set to null to hide. */
export const NAV_SOON: { label: string; message: string } | null = {
  label: "فروشگاه",
  message: "فروشگاه در فاز بعدی باز می‌شود",
};

/** Footer link columns: heading and [href, label] pairs. */
export const FOOTER_COLUMNS: [string, [string, string][]][] = [
  ["رزرو", [["/book/padel", "زمین پدل"], ["/book/beach?game=tennis", "تنیس ساحلی"], ["/book/beach?game=volley", "والیبال ساحلی"]]],
  ["کی کلاب", [["/coaches", "مربیان پدل"], ["/#how", "راهنمای رزرو"], ["/panel", "رزروهای من"]]],
];

/** One line under the logo in the footer. */
export const FOOTER_TEXT = "رزرو آنلاین زمین پدل، تنیس ساحلی و والیبال ساحلی. هر روز ساعت ۸ تا ۲۴.";
