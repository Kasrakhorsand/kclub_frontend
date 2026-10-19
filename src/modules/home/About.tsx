import { ABOUT, AMENITIES } from "@/config/home";
import { CONTACT, SHOW_PLACEHOLDERS } from "@/config/content";
import { fa } from "@/modules/core/format";
import { Icon3D } from "@/modules/ui/Icon3D";
import type { Icon3DName } from "@/modules/ui/icons3d";

type InfoItem = { icon: Icon3DName; title: string; text?: string; href?: string };

/** Hours and contact details; empty ones show as placeholders in development only. */
const INFO: InfoItem[] = (
  [
    { icon: "clock", title: "ساعت کاری", text: ABOUT.hours },
    { icon: "pin", title: "آدرس", text: CONTACT.address, href: CONTACT.mapUrl },
    { icon: "phone", title: "تماس با پذیرش", text: CONTACT.phone && fa(CONTACT.phone), href: CONTACT.phone && `tel:${CONTACT.phone}` },
    { icon: "insta", title: "اینستاگرام", text: `@${CONTACT.instagram}`, href: `https://instagram.com/${CONTACT.instagram}` },
  ] satisfies InfoItem[]
).filter((item) => item.text || SHOW_PLACEHOLDERS);

/** One contact tile; a link when it has a target (map, phone, Instagram). */
function InfoTile({ item }: { item: InfoItem }) {
  const body = (
    <>
      <Icon3D name={item.icon} />
      <span>
        <b>{item.title}</b>
        <span>{item.text ?? "جای خالی · config/content.ts"}</span>
      </span>
    </>
  );
  if (item.href && item.text)
    return (
      <a className="inf" href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {body}
      </a>
    );
  return <div className={item.text ? "inf" : "inf ph"}>{body}</div>;
}

/** Club intro, amenities grid and contact row. Content: `config/home.tsx` and `config/content.ts`. */
export function About() {
  return (
    <section className="about" data-reveal>
      <div className="wrap">
        <div className="abt">
          <span className="lat eyebrow">{ABOUT.eyebrow}</span>
          <h2>{ABOUT.title}</h2>
          <p>{ABOUT.text}</p>
        </div>
        <div className="amen">
          {AMENITIES.map((a) => (
            <div className="am" key={a.title}>
              <Icon3D name={a.icon} />
              <b>{a.title}</b>
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="wrap infow">
        <div className="info3">
          {INFO.map((item) => <InfoTile key={item.title} item={item} />)}
        </div>
      </div>
    </section>
  );
}
