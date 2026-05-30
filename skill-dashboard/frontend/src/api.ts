export const BASE = typeof window !== "undefined" && window.location.protocol === "file:"
  ? "http://localhost:3001/api"
  : "/api";

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
  try {
    const res = await fetch(`${BASE}/skills`);
    if (!res.ok) return { skills: [], total: 0 };
    return await res.json();
  } catch (err) {
    console.error("Error fetching skills:", err);
    return { skills: [], total: 0 };
  }
}

export async function fetchSkill(name: string): Promise<{ skill: SkillDetail }> {
  const res = await fetch(`${BASE}/skills/${encodeURIComponent(name)}`);
  return res.json();
}

export async function fetchAgents(): Promise<{ agents: AgentSummary[]; total: number }> {
  try {
    const res = await fetch(`${BASE}/agents`);
    if (!res.ok) return { agents: [], total: 0 };
    return await res.json();
  } catch (err) {
    console.error("Error fetching agents:", err);
    return { agents: [], total: 0 };
  }
}

export async function fetchAgent(name: string): Promise<{ agent: AgentDetail }> {
  const res = await fetch(`${BASE}/agents/${encodeURIComponent(name)}`);
  return res.json();
}
export interface SystemPaths {
  skillsDir: string;
  projectRoot: string;
  backendDir: string;
}

export async function fetchDashboard(): Promise<{ stats: DashboardStats; version?: string; update?: { status: string; version?: string | null; error?: string | null }; systemPaths?: SystemPaths }> {
  try {
    const res = await fetch(`${BASE}/dashboard`);
    if (!res.ok) throw new Error("Dashboard API returned not OK");
    return await res.json();
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return {
      stats: {
        totalSkills: 0,
        totalAgents: 0,
        frameworks: [],
        nativeAgents: 0,
        customAgents: 0,
        agentsByMode: {},
        agentsByCategory: {},
        skillFormats: { directory: 0, zip: 0 }
      }
    };
  }
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
  try {
    const res = await fetch(`${BASE}/skills-sh`);
    if (!res.ok) return { skills: [], total: 0 };
    return await res.json();
  } catch (err) {
    console.error("Error fetching skills-sh:", err);
    return { skills: [], total: 0 };
  }
}

export async function searchSkillsSh(q: string): Promise<{ skills: SkillsShSkill[]; count: number }> {
  try {
    const res = await fetch(`${BASE}/skills-sh/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return { skills: [], count: 0 };
    return await res.json();
  } catch (err) {
    console.error("Error searching skills-sh:", err);
    return { skills: [], count: 0 };
  }
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
