import { describe, expect, it } from "vitest";
import { addDays, dayKey } from "@/engine/format";
import { bookableDateParam, isAllowedPaymentUrl, openingHourParam, safeInternalPath } from "@/engine/security";

describe("safeInternalPath", () => {
  it("keeps in-app paths", () => {
    expect(safeInternalPath("/checkout")).toBe("/checkout");
    expect(safeInternalPath("/book/padel?date=2026-01-01")).toBe("/book/padel?date=2026-01-01");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "panel", "/pa\nnel", "", null, undefined])("refuses %s", (p) => {
    expect(safeInternalPath(p as string)).toBe("/panel");
  });
  it("uses the given fallback", () => expect(safeInternalPath("//x", "/")).toBe("/"));
});

describe("isAllowedPaymentUrl", () => {
  it("allows listed https gateways and their subdomains", () => {
    expect(isAllowedPaymentUrl("https://sep.shaparak.ir/pay?t=1")).toBe(true);
    expect(isAllowedPaymentUrl("https://ipg.pec.shaparak.ir/")).toBe(true);
  });
  it.each(["http://sep.shaparak.ir/", "https://evil.ir/", "https://sep.shaparak.ir.evil.ir/", "https://evilsep.shaparak.ir/", "javascript:alert(1)", "not a url"])("refuses %s", (u) => {
    expect(isAllowedPaymentUrl(u)).toBe(false);
  });
});

describe("bookableDateParam", () => {
  const today = dayKey(new Date());
  it("accepts today and near days", () => {
    expect(bookableDateParam(today)).toBe(today);
    expect(bookableDateParam(dayKey(addDays(new Date(), 30)))).not.toBeNull();
  });
  it("refuses past, far and malformed days", () => {
    expect(bookableDateParam(dayKey(addDays(new Date(), -1)))).toBeNull();
    expect(bookableDateParam(dayKey(addDays(new Date(), 200)))).toBeNull();
    expect(bookableDateParam("2026-1-1")).toBeNull();
    expect(bookableDateParam("<script>")).toBeNull();
    expect(bookableDateParam(null)).toBeNull();
  });
});

describe("openingHourParam", () => {
  it("accepts opening hours only", () => {
    expect(openingHourParam("10")).toBe(10);
    expect(openingHourParam("3")).toBeNull();
    expect(openingHourParam("10.5")).toBeNull();
    expect(openingHourParam("-1")).toBeNull();
    expect(openingHourParam(null)).toBeNull();
  });
});
