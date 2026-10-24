import { Navbar } from "@/ui/layout/Navbar";
import { Footer } from "@/ui/layout/Footer";
import { SiteNotice } from "@/ui/layout/SiteNotice";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNotice />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
