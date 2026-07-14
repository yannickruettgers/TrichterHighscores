import { describe, expect, it } from "vitest";
import { avatarDataUri } from "./avatar";

describe("avatarDataUri", () => {
  it("generates an SVG data URI without an external DiceBear request", () => {
    const avatar = avatarDataUri("Festival Fox");

    expect(avatar).toMatch(/^data:image\/svg\+xml;utf8,/);
    expect(avatar).not.toContain("api.dicebear.com");
    expect(decodeURIComponent(avatar.split(",", 2)[1])).toContain("<svg");
  });

  it("is deterministic and normalizes equivalent pseudonyms", () => {
    const avatar = avatarDataUri("  ÄNNA ");

    expect(avatarDataUri("  ÄNNA ")).toBe(avatar);
    expect(avatarDataUri("änna")).toBe(avatar);
    expect(avatarDataUri("ＦＯＸ")).toBe(avatarDataUri("fox"));
  });

  it("produces different avatars for different seeds", () => {
    expect(avatarDataUri("Alpha")).not.toBe(avatarDataUri("Bravo"));
  });
});
