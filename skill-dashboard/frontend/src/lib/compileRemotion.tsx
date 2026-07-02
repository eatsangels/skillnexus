// Compila en el navegador el código TSX del usuario a un componente React usable por
// <Player>, para previsualización en vivo sin necesidad de renderizar el MP4.
//
// Se usa @babel/standalone (runtime automático de JSX) y se transforma a CommonJS para
// poder inyectar `react` y `remotion` mediante un `require` controlado (sandbox de módulos:
// solo se permiten react y remotion; cualquier otro import falla con un mensaje claro).
import * as Babel from "@babel/standalone";
import React from "react";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as Remotion from "remotion";

const ALLOWED_MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": ReactJsxRuntime,
  "react/jsx-dev-runtime": ReactJsxRuntime,
  remotion: Remotion,
};

export interface CompileResult {
  component: React.ComponentType | null;
  error: string | null;
}

export function compileRemotion(code: string): CompileResult {
  try {
    const transformed = Babel.transform(code, {
      filename: "Main.tsx",
      presets: [
        ["react", { runtime: "automatic", development: false }],
        ["typescript", { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true }],
      ],
      plugins: ["transform-modules-commonjs"],
    }).code;

    if (!transformed) {
      return { component: null, error: "No se pudo compilar el código." };
    }

    const requireFn = (name: string): unknown => {
      if (name in ALLOWED_MODULES) return ALLOWED_MODULES[name];
      throw new Error(`El preview solo permite importar 'react' y 'remotion' (intentaste: '${name}').`);
    };

    const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
    // eslint-disable-next-line no-new-func
    const factory = new Function("require", "module", "exports", transformed);
    factory(requireFn, moduleObj, moduleObj.exports);

    const exported = moduleObj.exports as { default?: unknown } & Record<string, unknown>;
    const Comp = (exported.default || exported) as React.ComponentType;

    if (typeof Comp !== "function") {
      return { component: null, error: "El código debe exportar por defecto un componente React (export default)." };
    }

    return { component: Comp, error: null };
  } catch (err) {
    return { component: null, error: err instanceof Error ? err.message : String(err) };
  }
}
