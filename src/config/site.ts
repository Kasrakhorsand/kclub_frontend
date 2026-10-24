/**
 * K Club brand and site-wide text, read by the K Club UI (src/ui).
 * The shared engine never reads this file; another club writes its own.
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
  /**
   * Public address of the site, used for canonical links, the sitemap,
   * structured data and share images. Set NEXT_PUBLIC_SITE_URL in production
   * (e.g. https://kclub.ir); without it links point at localhost.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  /** Open Graph locale. */
  locale: "fa_IR",
  /** City and country for search results and AI answers ("پدل در تهران"). */
  city: "تهران",
  country: "IR",
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
  ["قوانین", [["/terms", "قوانین و مقررات"], ["/terms#refunds", "لغو و بازگشت وجه"], ["/privacy", "حریم خصوصی"]]],
];

/** One line under the logo in the footer. */
export const FOOTER_TEXT = "رزرو آنلاین زمین پدل، تنیس ساحلی و والیبال ساحلی. هر روز ساعت ۸ تا ۲۴.";
