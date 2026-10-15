import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, getAnalysis, getManifest, getPackage, getRun, getSkills, getSpec, getValidation, getVbaModules, listRuns, startRun } from "./api";
import AnalysisView from "./components/AnalysisView";
import RunStrip from "./components/RunStrip";
import Sidebar from "./components/Sidebar";
import SpecView from "./components/SpecView";
import Stepper from "./components/Stepper";
import TargetView from "./components/TargetView";
import UploadForm from "./components/UploadForm";
import ValidationView from "./components/ValidationView";
import VbaViewer from "./components/VbaViewer";
import { AnalyzeIcon, FileIcon, PackageIcon, SpecIcon, VerifyIcon } from "./components/icons";
import { EmptyState } from "./components/ui";
import { STEPS, UPLOAD_PAGE, keyForNode, stepStates, trackStates, type StepKey, type ViewKey } from "./steps";
import type { Analysis, Manifest, PackageInfo, Run, Skill, Spec, Validation, VbaModules } from "./types";

const POLL_MS = 2000;
const PAGE_ICONS: Record<StepKey, ReactNode> = {
  extract: <FileIcon size={30} />,
  analyze: <AnalyzeIcon size={30} />,
  spec: <SpecIcon size={30} />,
  verify: <VerifyIcon size={30} />,
  target: <PackageIcon size={30} />,
};

// Each backend stage, and the result file it produces.
type ResultKey = "vba" | "analysis" | "spec" | "manifest" | "validation" | "package";
const RESULT_OF_NODE: Record<string, ResultKey> = {
  extractor: "vba", analyzer: "analysis", spec_architect: "spec", generator: "manifest", validator: "validation", packager: "package",
};

export default function App() {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [vba, setVba] = useState<VbaModules | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<ViewKey>("upload");
  const [recent, setRecent] = useState<Run[]>([]);
  const [follow, setFollow] = useState(true); // follow the run from page to page until the user picks a page
  const timer = useRef<number | undefined>(undefined);
  const loaded = useRef<Set<ResultKey>>(new Set());

  useEffect(() => {
    getSkills().then(setSkills).catch((e) => setLoadError(e.message));
  }, []);

  const stopPolling = () => window.clearTimeout(timer.current);

  // Fetch each result once, as soon as the stage that produces it is done.
  const loadResult = useCallback(async (key: ResultKey, runId: string) => {
    if (loaded.current.has(key)) return;
    try {
      if (key === "vba") setVba(await getVbaModules(runId));
      else if (key === "analysis") setAnalysis(await getAnalysis(runId));
      else if (key === "spec") setSpec(await getSpec(runId));
      else if (key === "manifest") setManifest(await getManifest(runId));
      else if (key === "validation") setValidation(await getValidation(runId));
      else setPkg(await getPackage(runId));
      loaded.current.add(key);
    } catch {
      /* not produced (yet): the page shows its own empty state */
    }
  }, []);

  const poll = useCallback(async (runId: string) => {
    try {
      const latest = await getRun(runId);
      setRun(latest);
      await Promise.all(latest.nodes.filter((n) => n.status === "done" && RESULT_OF_NODE[n.name]).map((n) => loadResult(RESULT_OF_NODE[n.name], runId)));
      if (latest.status === "RUNNING") {
        timer.current = window.setTimeout(() => poll(runId), POLL_MS);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Lost contact with the server.");
    }
  }, [loadResult]);

  useEffect(() => stopPolling, []);

  // While following a run, show the page of the step that is running; when it ends, the last useful page.
  useEffect(() => {
    if (!run || !follow) return;
    if (run.status === "RUNNING") {
      const key = keyForNode(run.current_node);
      if (key) setView(key);
      return;
    }
    const states = stepStates(run);
    const failed = STEPS.findIndex((_s, i) => states[i] === "failed");
    if (failed >= 0) {
      setView(STEPS[failed].key);
      return;
    }
    let last = 0;
    states.forEach((st, i) => { if (st === "done") last = i; });
    setView(STEPS[last].key);
  }, [run?.status, run?.current_node, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetRun() {
    stopPolling();
    setSubmitError(null);
    setRun(null);
    setVba(null);
    setAnalysis(null);
    setSpec(null);
    setManifest(null);
    setValidation(null);
    setPkg(null);
    loaded.current = new Set();
    setFollow(true);
    setView("upload");
  }

  const refreshRecent = useCallback(() => {
    listRuns().then(setRecent).catch(() => setRecent([]));
  }, []);

  // After a browser refresh, pick up the most recent run so its pages are not lost.
  useEffect(() => {
    listRuns().then((runs) => {
      setRecent(runs);
      if (runs.length > 0) poll(runs[0].run_id);
    }).catch(() => undefined);
  }, [poll]);

  async function openRun(runId: string) {
    resetRun();
    await poll(runId);
  }

  async function onSubmit(skillId: string, file: File) {
    resetRun();
    setSubmitting(true);
    try {
      const { run_id } = await startRun(skillId, file);
      await poll(run_id);
      refreshRecent();
    } catch (e) {
      setSubmitError(e instanceof ApiError || e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const select = (key: ViewKey) => {
    setFollow(false);
    setView(key);
  };

  const running = submitting || run?.status === "RUNNING";
  const states = stepStates(run);
  const track = trackStates(run);
  const index = STEPS.findIndex((s) => s.key === view);
  const step = index >= 0 ? STEPS[index] : null;
  const state = index >= 0 ? states[index] : "idle";
  const head = step ?? UPLOAD_PAGE;
  const server = loadError ? "offline" : skills ? "online" : "connecting";

  // What the current page shows when its result is not there yet.
  const waiting = (): ReactNode => {
    if (view === "upload") return null;
    const icon = PAGE_ICONS[view];
    if (!run) {
      return (
        <EmptyState icon={icon} title="Nothing here yet" text="Upload a file on the Upload files page. This page fills in when that step of the migration has finished."
          action={<button type="button" className="btn-primary" onClick={() => select("upload")}>Go to Upload files</button>} />
      );
    }
    if (state === "off") {
      return <EmptyState icon={icon} title="This step is not enabled" text="Add its stage to ENABLED_STAGES in backend/.env and restart the server to include it in a run." />;
    }
    if (state === "failed") {
      return <EmptyState icon={icon} tone="red" title="This step failed" text={run.error?.message ?? "The step stopped before it could finish."} />;
    }
    if (state === "active") {
      return <EmptyState icon={icon} tone="busy" title="Working on it" text={run.detail ?? "This step is running. The page updates by itself when it is done."} />;
    }
    if (run.status === "FAILED") {
      return <EmptyState icon={icon} title="Not reached" text="An earlier step failed, so the migration never got to this one." />;
    }
    if (state === "done") {
      return <EmptyState icon={icon} title="Loading results" text="The step has finished. Reading its result from the server; if this stays, check that the server is still running." />;
    }
    return <EmptyState icon={icon} title="Waiting for earlier steps" text="This step starts when the one before it has finished." />;
  };

  let page: ReactNode;
  if (view === "upload") {
    page = (
      <>
        {skills && <UploadForm skills={skills} busy={running} error={submitError} onSubmit={onSubmit} />}
        {!skills && !loadError && <p className="muted">Loading...</p>}
        {loadError && <p className="error" role="alert">Could not reach the server: {loadError}</p>}
      </>
    );
  } else if (view === "extract") page = vba ? <VbaViewer data={vba} /> : waiting();
  else if (view === "analyze") page = analysis ? <AnalysisView data={analysis} /> : waiting();
  else if (view === "spec") page = spec && run ? <SpecView data={spec} runId={run.run_id} /> : waiting();
  else if (view === "verify") page = validation ? <ValidationView data={validation} /> : waiting();
  else page = run && (manifest || pkg) ? <TargetView manifest={manifest} pkg={pkg} runId={run.run_id} /> : waiting();

  return (
    <div className="shell">
      <Sidebar states={states} current={view} hasRun={run !== null} onSelect={select} />
      <div className="content">
        <header className="topbar">
          <label className="topbar-run">
            <span>Run</span>
            <select value={run?.run_id ?? ""} disabled={running || recent.length === 0} onChange={(e) => e.target.value && openRun(e.target.value)}>
              {!run && <option value="">{recent.length ? "Pick a past run" : "No runs yet"}</option>}
              {recent.map((r) => (
                <option key={r.run_id} value={r.run_id}>{r.filename} · {r.run_id.slice(0, 8)} · {r.status.replace(/_/g, " ").toLowerCase()}</option>
              ))}
            </select>
          </label>
          <span className={`status-pill ${server}`}>
            <span className="dot" aria-hidden="true" />
            {server === "online" ? "Server online" : server === "offline" ? "Server unreachable" : "Connecting..."}
          </span>
        </header>

        <main>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>Migration workspace</span>
            <span aria-hidden="true">›</span>
            <strong>{head.label}</strong>
          </nav>
          <div className="page-head">
            <div>
              <h1>{head.title}</h1>
              <p className="page-sub">{head.subtitle}</p>
            </div>
          </div>

          {run && view !== "upload" && <div className="card stepper-card"><Stepper states={track} current={view} onSelect={select} /></div>}
          {run && <RunStrip run={run} />}
          {page}
        </main>
      </div>
    </div>
  );
}
