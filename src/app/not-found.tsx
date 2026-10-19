import { Button3D } from "@/modules/ui/Buttons";
import { Navbar } from "@/modules/layout/Navbar";
import { Footer } from "@/modules/layout/Footer";

export default function NotFound() {
  return (
    <>
    <Navbar />
    <main className="gw" style={{ textAlign: "center" }}>
      <div className="card stack-l">
        <span className="lat eyebrow" style={{ color: "var(--gold)" }}>404</span>
        <h2>این صفحه پیدا نشد</h2>
        <p className="muted">شاید آدرس اشتباه است یا صفحه جابه‌جا شده.</p>
        <Button3D href="/sport">رزرو زمین</Button3D>
      </div>
    </main>
    <Footer />
    </>
  );
}
