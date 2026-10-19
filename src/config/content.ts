/**
 * Editable site content: club photos, player reviews and contact details.
 *
 * Anything left empty here shows as a dashed placeholder in development
 * (`npm run dev`) and is hidden in production, so the live site never shows
 * a gap. Put photos in `public/media/club/` and reference them as
 * "/media/club/<file>.jpg".
 */

export type GalleryPhoto = {
  /** Image path under /public; leave undefined until the photo exists. */
  src?: string;
  alt: string;
  caption: string;
  /** Spans two columns on desktop. */
  wide?: boolean;
};

export const GALLERY: GalleryPhoto[] = [
  { alt: "نمای داخل سوله‌ی پدل", caption: "سوله‌ی پدل", wide: true },
  { alt: "زمین پدل با چمن آبی", caption: "زمین چمن آبی" },
  { alt: "زمین پدل با چمن مشکی", caption: "زمین چمن مشکی" },
  { alt: "زمین‌های ماسه‌ای ساحلی", caption: "زمین‌های ساحلی", wide: true },
  { alt: "رختکن مجموعه", caption: "رختکن و دوش" },
  { alt: "کافه‌ی مجموعه", caption: "کافه" },
];

export type Review = {
  name: string;
  /** e.g. "پدل" or "والیبال ساحلی" */
  sport: string;
  /** 1–5 */
  rating: number;
  text: string;
};

/** Real player reviews only. Leave empty until you have them. */
export const REVIEWS: Review[] = [];

export const CONTACT = {
  /** Street address shown with the map pin. */
  address: undefined as string | undefined,
  /** Front-desk phone in Latin digits, e.g. "02100000000". */
  phone: undefined as string | undefined,
  instagram: "kclub.padel",
  /** Google Maps / Neshan link for the address. */
  mapUrl: undefined as string | undefined,
};

/** Show placeholders for missing content (development only). */
export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";
