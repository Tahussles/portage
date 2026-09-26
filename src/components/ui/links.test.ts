import { describe, expect, it } from "vitest";
import { isCurrent, nextScreen, withDemo } from "./links";

describe("demo links", () => {
  it("adds demo=1 only when demo mode is on", () => {
    expect(withDemo("/roadmap", false)).toBe("/roadmap");
    expect(withDemo("/roadmap", true)).toBe("/roadmap?demo=1");
  });

  it("keeps existing query and hash, and is idempotent", () => {
    expect(withDemo("/?lang=fr#how", true)).toBe("/?lang=fr&demo=1#how");
    expect(withDemo("/roadmap?demo=1", true)).toBe("/roadmap?demo=1");
  });

  it("leaves external links alone", () => {
    expect(withDemo("https://www.cno.org", true)).toBe("https://www.cno.org");
  });
});

describe("walk-through order", () => {
  it("goes start, roadmap, documents, insights, then back to the landing", () => {
    expect(nextScreen("start").href).toBe("/roadmap");
    expect(nextScreen("roadmap").href).toBe("/documents");
    expect(nextScreen("documents").href).toBe("/insights");
    expect(nextScreen("insights")).toEqual({ id: "home", href: "/" });
  });

  it("marks the current screen", () => {
    expect(isCurrent("/roadmap", "/roadmap")).toBe(true);
    expect(isCurrent("/", "/roadmap")).toBe(false);
  });
});
