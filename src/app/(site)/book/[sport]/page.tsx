import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Booking } from "@/components/site/Booking";
import type { Sport } from "@/lib/types";

export function generateStaticParams() {
  return [{ sport: "padel" }, { sport: "beach" }];
}

export default async function BookPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (sport !== "padel" && sport !== "beach") notFound();
  return (
    <Suspense>
      <Booking sport={sport as Sport} />
    </Suspense>
  );
}
