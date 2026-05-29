const BASE = "/api";

export interface SkillSummary {
  name: string;
  description: string;
  descriptionEn?: string;
  descriptionEs?: string;
  format: string;
  location: string;
  frameworks: string[];
  lastModified: string;
}

export interface SkillDetail extends SkillSummary {
  body: string;
  data: Record<string, unknown>;
  assets: string[];
  references: string[];
}

export interface UseCases {
  use: string[];
  avoid: string[];
  formats: string[];
}

export interface AgentSummary {
  name: string;
  displayName: string;
  description: string;
  descriptionEn?: string;
  descriptionEs?: string;
  mode: string;
  native: boolean;
  source: string;
  color: string | null;
  model: { modelID: string; providerID: string } | string | null;
  hidden: boolean;
  emoji: string | null;
  category: string;
  invocation: string;
  useCases?: UseCases;
}

export interface AgentDetail extends AgentSummary {
  temperature: number | null;
  topP: number | null;
  steps: number | null;
  variant: string | null;
  tools: Record<string, boolean> | null;
  prompt: string | null;
  permission: Record<string, unknown> | null;
  options: Record<string, unknown>;
  vibe?: string | null;
}

export interface DashboardStats {
  totalSkills: number;
  totalAgents: number;
  frameworks: string[];
  nativeAgents: number;
  customAgents: number;
  agentsByMode: Record<string, number>;
  agentsByCategory: Record<string, number>;
  skillFormats: { directory: number; zip: number };
}

export async function fetchSkills(): Promise<{ skills: SkillSummary[]; total: number }> {
  const res = await fetch(`${BASE}/skills`);
  return res.json();
}

export async function fetchSkill(name: string): Promise<{ skill: SkillDetail }> {
  const res = await fetch(`${BASE}/skills/${encodeURIComponent(name)}`);
  return res.json();
}

export async function fetchAgents(): Promise<{ agents: AgentSummary[]; total: number }> {
  const res = await fetch(`${BASE}/agents`);
  return res.json();
}

export async function fetchAgent(name: string): Promise<{ agent: AgentDetail }> {
  const res = await fetch(`${BASE}/agents/${encodeURIComponent(name)}`);
  return res.json();
}

export async function fetchDashboard(): Promise<{ stats: DashboardStats }> {
  const res = await fetch(`${BASE}/dashboard`);
  return res.json();
}

export interface SkillsShSkill {
  id: string;
  name: string;
  slug: string;
  source: string;
  installs: number;
  topic: string | null;
  url: string;
  installUrl: string;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  category?: string;
}

export interface SkillsShDetail {
  source: string;
  slug: string;
  skMd: string | null;
  skPath: string | null;
  description: string | null;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  topic: string | null;
}

export async function fetchSkillsSh(): Promise<{ skills: SkillsShSkill[]; total: number }> {
  const res = await fetch(`${BASE}/skills-sh`);
  return res.json();
}

export async function searchSkillsSh(q: string): Promise<{ skills: SkillsShSkill[]; count: number }> {
  const res = await fetch(`${BASE}/skills-sh/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function fetchSkillsShDetail(source: string, slug: string): Promise<{ skill: SkillsShDetail }> {
  const res = await fetch(`${BASE}/skills-sh/${encodeURIComponent(source)}/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export async function installSkillsSh(source: string, slug: string): Promise<{ success: boolean; result: unknown }> {
  const res = await fetch(`${BASE}/skills-sh/install`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, slug }),
  });
  if (!res.ok) throw new Error("Install failed");
  return res.json();
}
