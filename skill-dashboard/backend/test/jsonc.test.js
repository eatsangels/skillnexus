import { describe, it, expect } from "vitest";
import { parseJsonc, stripJsonComments } from "../src/agent-scanner.js";

describe("parseJsonc — regresión del bug del parser de opencode.jsonc", () => {
  it("preserva URLs (con //) dentro de strings", () => {
    const jsonc = `{
      // comentario de línea
      "agent": {
        "docs": { "description": "Ver https://ejemplo.com//ruta y http://x.io" }
      }
    }`;
    const cfg = parseJsonc(jsonc);
    expect(cfg.agent.docs.description).toBe("Ver https://ejemplo.com//ruta y http://x.io");
  });

  it("elimina comentarios de línea y de bloque fuera de strings", () => {
    const jsonc = `{
      /* bloque */
      "a": 1, // inline
      "b": 2
    }`;
    expect(parseJsonc(jsonc)).toEqual({ a: 1, b: 2 });
  });

  it("tolera comas colgantes", () => {
    const jsonc = `{ "a": 1, "b": [1, 2,], }`;
    expect(parseJsonc(jsonc)).toEqual({ a: 1, b: [1, 2] });
  });

  it("no corta secuencias // que están dentro de una cadena", () => {
    const out = stripJsonComments('{"u":"a//b//c"}');
    expect(out).toContain("a//b//c");
  });
});
