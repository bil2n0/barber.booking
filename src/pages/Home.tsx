import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import Hero from "@/sections/Hero";
import Marquee from "@/sections/Marquee";
import Services from "@/sections/Services";
import Booking from "@/sections/Booking";
import Visit, { Footer } from "@/sections/Visit";

export default function Home() {
  const bookingRef = useRef<HTMLElement>(null);
  const [preselected, setPreselected] = useState<string | null>(null);

  const bookService = (serviceId: string) => {
    setPreselected(serviceId);
    bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Services onBook={bookService} />
        <Booking ref={bookingRef} preselected={preselected} />
        <Visit />
      </main>
      <Footer />
    </div>
  );
}
