import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Booking } from "@/components/site/Booking";
import type { Metadata } from "next";
import type { Sport } from "@/lib/types";

export function generateStaticParams() {
  return [{ sport: "padel" }, { sport: "beach" }];
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const { sport } = await params;
  return sport === "padel"
    ? { title: "رزرو زمین پدل", description: "سانس‌های خالی زمین‌های پدل کی کلاب را ببینید و آنلاین رزرو کنید." }
    : { title: "رزرو زمین ساحلی", description: "رزرو آنلاین زمین ماسه‌ای برای تنیس ساحلی و والیبال ساحلی در کی کلاب." };
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
