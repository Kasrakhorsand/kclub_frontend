import Link from "next/link";
import { Brand } from "./Brand";
import { fa } from "@/lib/format";

const COLS: [string, [string, string][]][] = [
  ["رزرو", [["/book/padel", "زمین پدل"], ["/book/beach?game=tennis", "تنیس ساحلی"], ["/book/beach?game=volley", "والیبال ساحلی"]]],
  ["کی کلاب", [["/coaches", "مربیان پدل"], ["/#how", "راهنمای رزرو"], ["/panel", "رزروهای من"]]],
];

export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftg">
        <div className="fab">
          <Brand sub="PADEL · BEACH CLUB" />
          <p>رزرو آنلاین زمین پدل، تنیس ساحلی و والیبال ساحلی. هر روز ساعت {fa(8)} تا {fa(24)}.</p>
        </div>
        {COLS.map(([t, links]) => (
          <nav key={t} aria-label={t}>
            <b>{t}</b>
            {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
        ))}
      </div>
      <div className="wrap fbt">© {fa(new Date().getFullYear())} K Club</div>
    </footer>
  );
}
