import Link from "next/link";
import { Brand } from "@/ui/layout/Brand";
import { fa } from "@/engine/format";
import { FOOTER_COLUMNS, FOOTER_TEXT, SITE } from "@/config/site";

/** Site footer shown on every public page and the 404 page. */
export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftg">
        <div className="fab">
          <Brand sub={SITE.tagline} />
          <p>{FOOTER_TEXT}</p>
        </div>
        {FOOTER_COLUMNS.map(([t, links]) => (
          <nav key={t} aria-label={t}>
            <b>{t}</b>
            {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
        ))}
      </div>
      <div className="wrap fbt">© {fa(new Date().getFullYear())} {SITE.latinName}</div>
    </footer>
  );
}
