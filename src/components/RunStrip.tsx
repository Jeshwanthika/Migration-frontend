import type { Run } from "../types";

export default function RunStrip({ run }: { run: Run }) {
  const tone = run.status === "FAILED" ? "red" : run.status === "RUNNING" ? "blue" : run.status === "COMPLETED" ? "green" : "amber";
  const text = run.status === "RUNNING" ? "Running" : run.status === "COMPLETED" ? "Completed" : run.status === "COMPLETED_WITH_WARNINGS" ? "Completed with warnings" : "Failed";
  return (
    <div className="card run-strip">
      <div className="run-strip-main">
        <span className="run-file">{run.filename}</span>
        <span className={`chip ${tone}`}>{text}</span>
        {run.status === "RUNNING" && run.detail && <span className="muted small">{run.detail}</span>}
      </div>
      <dl className="run-strip-meta">
        <div><dt>Run</dt><dd><code>{run.run_id.slice(0, 8)}</code></dd></div>
        <div><dt>Flags</dt><dd>{run.flags_count}</dd></div>
        <div><dt>Tokens</dt><dd>{run.tokens_used.toLocaleString()}</dd></div>
      </dl>
    </div>
  );
}
