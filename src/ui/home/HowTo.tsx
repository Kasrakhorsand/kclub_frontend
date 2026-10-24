import { HOW_TO } from "@/config/home";
import { fa } from "@/engine/format";
import { Button3D } from "@/ui/kit/Buttons";

/** Numbered booking steps and the FAQ accordion (anchor #how). Content: `config/home.tsx`. */
export function HowTo({ faq }: { faq: [question: string, answer: string][] }) {
  return (
    <section className="how" id="how" data-reveal>
      <div className="wrap">
        <div className="howhd">
          <span className="lat eyebrow">{HOW_TO.eyebrow}</span>
          <h2>{HOW_TO.title}</h2>
          <p className="muted">{HOW_TO.text}</p>
        </div>
        <ol className="steps">
          {HOW_TO.steps.map(([title, body], i) => (
            <li key={title}>
              <span className="sn">{fa(i + 1)}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
        <div className="faq">
          <div className="faqhd">
            <span className="lat eyebrow">FAQ · سؤالات متداول</span>
            <h2>قبل از شروع</h2>
          </div>
          <div className="faqg">
            {faq.map(([question, answer]) => (
              <details className="fq" key={question}>
                <summary>
                  <span>{question}</span>
                  <i aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="howcta">
          <Button3D size="lg" href="/sport">شروع رزرو</Button3D>
        </div>
      </div>
    </section>
  );
}
