"use client";
import { Button3D, LockIcon } from "@/ui/kit/Buttons";
import { toast } from "@/ui/kit/Toast";

/** Locked "book first session" button on each coach card (coach booking ships in a later phase). */
export function CoachBook() {
  return (
    <Button3D variant="dark" block onClick={() => toast("رزرو جلسه‌ی مربی در فاز بعدی فعال می‌شود")}>
      <LockIcon /> رزرو جلسه اول
    </Button3D>
  );
}
