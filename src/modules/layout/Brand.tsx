/* eslint-disable @next/next/no-img-element */
import { SITE } from "@/config/site";

/** Emblem + wordmark lockup from `config/site.ts`; `sub` is the small caption under the wordmark. */
export function Brand({ sub }: { sub: string }) {
  return (
    <span className="brand">
      <img className="emb" src={SITE.logo.emblem} alt="" width={40} height={40} />
      <span>
        <img className="wm" src={SITE.logo.wordmark} alt={SITE.latinName} height={17} />
        <small>{sub}</small>
      </span>
    </span>
  );
}
