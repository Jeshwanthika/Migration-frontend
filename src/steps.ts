import type { Run } from "./types";

export type StepState = "idle" | "active" | "done" | "failed" | "off";
export type StepKey = "extract" | "analyze" | "spec" | "verify" | "target";
export type ViewKey = "upload" | StepKey;

export interface StepDef {
  key: StepKey;
  label: string;
  title: string; // page heading
  subtitle: string; // page description
  nodes: string[]; // backend stage names that make up this step
}

export const UPLOAD_PAGE = {
  label: "Upload files",
  title: "Upload Files",
  subtitle: "Choose the source and target technology, then upload the file to migrate.",
};

// The pipeline pages, in the order they appear in the sidebar. The backend still runs
// extractor > analyzer > spec > generator > validator > packager; "Target File" shows the
// results of the generator and the packager together.
export const STEPS: StepDef[] = [
  { key: "extract", label: "Extract", title: "Extracted VBA Code", nodes: ["intake_check", "extractor"],
    subtitle: "The VBA code read out of your workbook. The macros are never run." },
  { key: "analyze", label: "Analyze", title: "Code Analysis", nodes: ["analyzer"],
    subtitle: "Every procedure is classified by role and checked against the migration coverage matrix." },
  { key: "spec", label: "Migration Spec", title: "Migration Specification", nodes: ["spec_architect"],
    subtitle: "A technology-neutral description of what the workbook does: entities, rules, screens, workflows and reports." },
  { key: "verify", label: "Verification", title: "Build Verification", nodes: ["validator"],
    subtitle: "The generated app is restored and compiled with the .NET SDK. Compiler errors are listed with the spec item they came from." },
  { key: "target", label: "Target File", title: "Target File", nodes: ["generator", "packager"],
    subtitle: "The generated ASP.NET Core 8 application and the ZIP package to download." },
];

// The progress tracker above each page keeps all six stages of the pipeline, in run order.
// Each stage opens the page that shows its result ("Generated App" and "Package Zip" both open Target File).
export interface TrackDef { label: string; nodes: string[]; view: StepKey }
export const TRACK: TrackDef[] = [
  { label: "Extract", nodes: ["intake_check", "extractor"], view: "extract" },
  { label: "Analyze", nodes: ["analyzer"], view: "analyze" },
  { label: "Migration Spec", nodes: ["spec_architect"], view: "spec" },
  { label: "Generated App", nodes: ["generator"], view: "target" },
  { label: "Verification", nodes: ["validator"], view: "verify" },
  { label: "Package Zip", nodes: ["packager"], view: "target" },
];

function stateOf(run: Run | null, nodeNames: string[], first: boolean): StepState {
  if (!run) return first ? "active" : "idle";
  const nodes = run.nodes.filter((n) => nodeNames.includes(n.name));
  if (nodes.length === 0) return "off";
  if (nodes.some((n) => n.status === "failed")) return "failed";
  if (nodes.some((n) => n.status === "running")) return "active";
  if (nodes.every((n) => n.status === "done")) return "done";
  return "idle";
}

export function trackStates(run: Run | null): StepState[] {
  return TRACK.map((t, i) => stateOf(run, t.nodes, i === 0));
}

/** State of each step for the current run (or before any run has started). */
export function stepStates(run: Run | null): StepState[] {
  if (!run) return STEPS.map((_s, i) => (i === 0 ? "active" : "idle"));
  return STEPS.map((step) => {
    const nodes = run.nodes.filter((n) => step.nodes.includes(n.name));
    if (nodes.length === 0) return "off"; // this stage is not enabled in this build
    if (nodes.some((n) => n.status === "failed")) return "failed";
    if (nodes.some((n) => n.status === "running")) return "active";
    if (nodes.every((n) => n.status === "done")) return "done";
    return "idle";
  });
}

export function keyForNode(node: string | null | undefined): StepKey | null {
  if (!node) return null;
  return STEPS.find((s) => s.nodes.includes(node))?.key ?? null;
}
