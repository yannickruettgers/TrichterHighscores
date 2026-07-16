import { describe, expect, it } from "vitest";
import { parseTimeSeconds } from "./time.js";

describe("parseTimeSeconds", () => {
  it("accepts a German decimal comma", () => {
    expect(parseTimeSeconds("1,001")).toBe(1.001);
  });

  it("accepts a decimal point", () => {
    expect(parseTimeSeconds("1.001")).toBe(1.001);
  });

  it.each(["", "0", "1,2,3", "seconds"])('rejects invalid values: %s', (value) => {
    expect(parseTimeSeconds(value)).toBeNull();
  });
});