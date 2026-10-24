/** Same share card for X/Twitter links (see opengraph-image.tsx). */
import { SITE } from "@/config/site";
import OpengraphImage from "./opengraph-image";

export const alt = `${SITE.latinName} | ${SITE.seoTitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
