/** Number formatting used on panel pages. */
import { fa } from "@/engine/format";

/** Toman amount as "۱۲٫۳ میلیون" (one decimal). */
export const millions = (toman: number) => `${fa(Math.round(toman / 1e5) / 10)} میلیون`;
