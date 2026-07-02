// Declaraciones mínimas para los submódulos de prismjs que no traen tipos propios.
declare module "prismjs/components/prism-core" {
  export const languages: Record<string, unknown>;
  export function highlight(text: string, grammar: unknown, language: string): string;
}
declare module "prismjs/components/prism-clike";
declare module "prismjs/components/prism-markup";
declare module "prismjs/components/prism-javascript";
declare module "prismjs/components/prism-jsx";
declare module "prismjs/components/prism-typescript";
declare module "prismjs/components/prism-tsx";
declare module "prismjs/themes/prism-tomorrow.css";
