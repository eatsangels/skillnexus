import { describe, it, expect } from "vitest";
import { scanAgents } from "../src/agent-scanner.js";
import { scanSkills } from "../src/skill-scanner.js";

describe("scanAgents — invariantes del dedup", () => {
  const agents = scanAgents();

  it("devuelve un array no vacío (al menos los built-in)", () => {
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it("no produce nombres duplicados (regresión del dedup que descartaba archivos)", () => {
    const names = agents.map((a) => a.name);
    const dups = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dups).toEqual([]);
  });

  it("incluye los agentes built-in de OpenCode", () => {
    const names = agents.map((a) => a.name);
    expect(names).toContain("build");
    expect(names).toContain("plan");
    expect(names).toContain("general");
  });

  it("cada agente tiene name y description definidos (YAML inválido no rompe la entrada)", () => {
    for (const a of agents) {
      expect(typeof a.name).toBe("string");
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description === "" || typeof a.description === "string").toBe(true);
    }
  });
});

describe("scanSkills — invariantes", () => {
  const skills = scanSkills();

  it("devuelve un array", () => {
    expect(Array.isArray(skills)).toBe(true);
  });

  it("no produce nombres duplicados", () => {
    const names = skills.map((s) => s.name);
    const dups = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dups).toEqual([]);
  });
});
