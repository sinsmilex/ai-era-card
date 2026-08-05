import { describe, expect, it } from "vitest";
import { parseTrackEvent, EXAMPLE_SLUG } from "./trackEvent";

describe("parseTrackEvent", () => {
  it("accepts each client kind without a slug", () => {
    for (const kind of [
      "card_cta",
      "command_copy",
      "preview_click",
      "caption_copy",
    ] as const) {
      expect(parseTrackEvent({ kind })).toEqual({ kind, slug: null });
    }
  });

  it("keeps the slug only for preview_click with the exact example slug", () => {
    expect(parseTrackEvent({ kind: "preview_click", slug: EXAMPLE_SLUG })).toEqual({
      kind: "preview_click",
      slug: EXAMPLE_SLUG,
    });
  });

  it("drops a wrong preview_click slug (normalize, not reject)", () => {
    expect(parseTrackEvent({ kind: "preview_click", slug: "other" })).toEqual({
      kind: "preview_click",
      slug: null,
    });
  });

  it("drops a slug supplied on non-preview events", () => {
    expect(parseTrackEvent({ kind: "card_cta", slug: EXAMPLE_SLUG })).toEqual({
      kind: "card_cta",
      slug: null,
    });
    expect(parseTrackEvent({ kind: "command_copy", slug: "x" })).toEqual({
      kind: "command_copy",
      slug: null,
    });
    expect(parseTrackEvent({ kind: "caption_copy", slug: "x" })).toEqual({
      kind: "caption_copy",
      slug: null,
    });
  });

  it("rejects unknown, missing, or malformed kinds", () => {
    for (const body of [
      { kind: "hack" }, { kind: "" }, { kind: 1 }, {}, null, undefined,
      "string", { slug: EXAMPLE_SLUG },
    ]) {
      expect(parseTrackEvent(body)).toBeNull();
    }
  });
});
