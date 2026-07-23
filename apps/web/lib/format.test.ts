import { describe, expect, it } from "vitest";
import { fmtShare } from "./format";

describe("fmtShare", () => {
  it("shows whole percents for large shares", () => {
    expect(fmtShare(0.77)).toBe("77%");
    expect(fmtShare(0.1)).toBe("10%");
  });

  it("shows one decimal for 1–10% shares", () => {
    expect(fmtShare(0.024)).toBe("2.4%");
    expect(fmtShare(0.099)).toBe("9.9%");
  });

  it("never rounds a real source to 0% (the reported bug)", () => {
    expect(fmtShare(0.004)).toBe("0.4%");
    expect(fmtShare(0.001)).toBe("0.1%");
  });

  it("uses <0.1% for vanishingly small but non-zero shares", () => {
    expect(fmtShare(0.0003)).toBe("<0.1%");
  });

  it("shows 0% only for a genuinely zero share", () => {
    expect(fmtShare(0)).toBe("0%");
  });
});
