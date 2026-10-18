"use client";
import { Button3D, LockIcon } from "../ui/Buttons";
import { toast } from "../ui/Toast";

export function CoachBook() {
  return (
    <Button3D variant="dark" block onClick={() => toast("رزرو جلسه‌ی مربی در فاز بعدی فعال می‌شود")}>
      <LockIcon /> رزرو جلسه اول
    </Button3D>
  );
}
