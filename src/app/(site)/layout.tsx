import { Navbar } from "@/modules/layout/Navbar";
import { Footer } from "@/modules/layout/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
