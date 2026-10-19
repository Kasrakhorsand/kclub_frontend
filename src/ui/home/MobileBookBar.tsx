"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Button3D } from "@/ui/kit/Buttons";

/**
 * Phone-only "book a court" bar pinned to the bottom of the screen. Appears
 * once the hero has scrolled away and hides again over the closing banner
 * and footer, which already have their own buttons.
 */
export function MobileBookBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".hero3");
    const end = document.querySelector(".fcta");
    if (!hero) return;
    let pastHero = false;
    let atEnd = false;
    const update = () => setVisible(pastHero && !atEnd);
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) pastHero = !e.isIntersecting;
        if (e.target === end) atEnd = e.isIntersecting || e.boundingClientRect.top < 0;
      }
      update();
    });
    observer.observe(hero);
    if (end) observer.observe(end);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={clsx("mbar", visible && "on")} inert={!visible}>
      <span>
        <b>زمین خالی داری؟</b>
        <span className="xs">سانس‌های امروز را ببین</span>
      </span>
      <Button3D href="/sport" size="sm">رزرو زمین</Button3D>
    </div>
  );
}
