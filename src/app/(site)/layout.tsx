import { Navbar } from "@/ui/layout/Navbar";
import { Footer } from "@/ui/layout/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
