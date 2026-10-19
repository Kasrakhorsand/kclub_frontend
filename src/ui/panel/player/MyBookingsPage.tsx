"use client";
/** Player › My bookings (/panel/res): upcoming bookings with cancel and refund. */
import { fa } from "@/engine/format";
import { Button3D } from "@/ui/kit/Buttons";
import { BookingList } from "@/ui/panel/player/BookingList";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function MyBookingsView() {
  return (
    <>
      <PageHead
        title="رزروهای من"
        sub={`لغو تا ${fa(24)} ساعت قبل: بازگشت ۱۰۰٪ · تا ${fa(6)} ساعت قبل: ۵۰٪`}
        action={<Button3D href="/sport" size="sm">رزرو جدید</Button3D>}
      />
      <div className="card"><BookingList cancellable /></div>
    </>
  );
}
