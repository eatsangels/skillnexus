import { describe, it, expect } from "vitest";
import { isValidRepo, isValidSlug, validateInstallInput } from "../src/validate.js";

describe("validate — allowlist anti inyección", () => {
  it("acepta repos y slugs legítimos", () => {
    expect(isValidRepo("vercel-labs/agent-skills")).toBe(true);
    expect(isValidRepo("owner/repo.name_1")).toBe(true);
    expect(isValidSlug("vercel-composition-patterns")).toBe(true);
    expect(isValidSlug("valid_slug.1-2")).toBe(true);
  });

  it("rechaza metacaracteres de shell en source", () => {
    expect(isValidRepo("foo/bar; rm -rf ~")).toBe(false);
    expect(isValidRepo("$(calc)")).toBe(false);
    expect(isValidRepo("foo/bar`whoami`")).toBe(false);
    expect(isValidRepo("foo/bar && echo hi")).toBe(false);
    expect(isValidRepo("no-slash")).toBe(false);
  });

  it("rechaza separadores de ruta y metacaracteres en slug", () => {
    expect(isValidSlug("../../etc/passwd")).toBe(false);
    expect(isValidSlug("slug` whoami`")).toBe(false);
    expect(isValidSlug("a/b")).toBe(false);
    expect(isValidSlug("a b")).toBe(false);
  });

  it("rechaza tipos no string y valores demasiado largos", () => {
    expect(isValidRepo(null)).toBe(false);
    expect(isValidSlug(undefined)).toBe(false);
    expect(isValidRepo("a/".padEnd(300, "b"))).toBe(false);
  });

  it("validateInstallInput devuelve ok/error coherente", () => {
    expect(validateInstallInput("vercel-labs/agent-skills", "x").ok).toBe(true);
    const bad = validateInstallInput("foo/bar; rm -rf", "x");
    expect(bad.ok).toBe(false);
    expect(bad.error).toContain("source");
    const badSlug = validateInstallInput("foo/bar", "../etc");
    expect(badSlug.ok).toBe(false);
    expect(badSlug.error).toContain("slug");
  });
});
