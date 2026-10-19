import { Button3D } from "@/ui/kit/Buttons";
import { FINAL_CTA } from "@/config/home";

/** Closing black-and-gold banner before the footer. */
export function FinalCta() {
  return (
    <section className="fcta" aria-labelledby="fcta-title" data-reveal>
      <div className="wrap">
        <span className="lat eyebrow" dir="ltr">{FINAL_CTA.eyebrow}</span>
        <h2 id="fcta-title">
          {FINAL_CTA.title.before} <b>{FINAL_CTA.title.highlight}</b>
        </h2>
        <p>{FINAL_CTA.text}</p>
        <div className="fcb">
          <Button3D size="lg" href="/sport">رزرو زمین</Button3D>
          <Button3D size="lg" variant="dark" href={FINAL_CTA.secondary.href}>{FINAL_CTA.secondary.label}</Button3D>
        </div>
      </div>
    </section>
  );
}
