import { describe, expect, it } from "vitest";
import { addDays, dayKey, fa, faNum, hm, isValidNationalId, timeUntil, toLatinDigits, toman } from "@/engine/format";

describe("numbers", () => {
  it("writes Persian digits and separators", () => {
    expect(fa(1234)).toBe("۱۲۳۴");
    expect(faNum(1250000)).toBe("۱٬۲۵۰٬۰۰۰");
    expect(toman(500000)).toBe("۵۰۰٬۰۰۰ تومان");
    expect(hm(8)).toBe("۰۸:۰۰");
    expect(hm(24)).toBe("۰۰:۰۰");
    expect(toLatinDigits("۰۹۱۲")).toBe("0912");
  });
});

describe("days", () => {
  it("adds days across month ends", () => {
    expect(dayKey(addDays(new Date("2026-01-31T12:00:00"), 1))).toBe("2026-02-01");
  });
});

describe("timeUntil", () => {
  const now = new Date("2026-03-01T10:00:00").getTime();
  it("counts down and stops at the start", () => {
    expect(timeUntil("2026-03-01", 11, now)).toBe("۱ ساعت");
    expect(timeUntil("2026-03-03", 13, now)).toBe("۲ روز و ۳ ساعت");
    expect(timeUntil("2026-03-01", 10, now)).toBeNull();
  });
});

describe("isValidNationalId", () => {
  it("checks the control digit", () => {
    expect(isValidNationalId("0499370899")).toBe(true);
    expect(isValidNationalId("۰۴۹۹۳۷۰۸۹۹")).toBe(true);
    expect(isValidNationalId("0499370898")).toBe(false);
    expect(isValidNationalId("1111111111")).toBe(false);
    expect(isValidNationalId("123")).toBe(false);
  });
});
