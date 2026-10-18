import { Button3D } from "../../ui/Buttons";

/** Closing black-and-gold banner before the footer. */
export function FinalCta() {
  return (
    <section className="fcta" aria-labelledby="fcta-title" data-reveal>
      <div className="wrap">
        <span className="lat eyebrow" dir="ltr">Ready to play?</span>
        <h2 id="fcta-title">
          امروز زمینت را <b>رزرو کن</b>
        </h2>
        <p>سانس خالی را ببین، زمین را انتخاب کن و در کمتر از دو دقیقه پرداخت کن.</p>
        <div className="fcb">
          <Button3D size="lg" href="/sport">رزرو زمین</Button3D>
          <Button3D size="lg" variant="dark" href="/coaches">کلاس با مربی</Button3D>
        </div>
      </div>
    </section>
  );
}
