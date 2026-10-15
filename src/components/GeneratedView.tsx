import type { Manifest } from "../types";
import { Stats, severityTone } from "./ui";

/** Summary of the generated app: the numbers and the places that need a decision. */
export default function GeneratedView({ data }: { data: Manifest }) {
  const warnings = data.flags.filter((f) => f.severity !== "Info" && f.code !== "GENERATION_FAILED");
  const attention = data.stubs.length + data.uncovered_spec_items.length + warnings.length;

  return (
    <>
      <Stats
        items={[
          { label: "Files generated", value: data.files.length, hint: data.app_name, tone: "purple" },
          { label: "Stubs", value: data.stubs.length, hint: "marked MIGRATION-TODO", tone: data.stubs.length ? "amber" : "green" },
          { label: "Not generated", value: data.uncovered_spec_items.length, hint: "spec items left out", tone: data.uncovered_spec_items.length ? "red" : "green" },
          { label: "Model usage", value: data.usage.tokens.toLocaleString(), hint: `tokens, ${data.usage.calls} calls in ${data.usage.batches} batches` },
        ]}
      />

      {attention > 0 && (
        <section className="card">
          <header className="card-head">
            <h2>Needs attention</h2>
            <span className="chip amber">{attention}</span>
          </header>
          <p className="muted">Places where the generated code is a placeholder or needs a decision.</p>
          <ul className="flags">
            {data.stubs.map((s) => (
              <li key={s.spec_id}>
                <div className="flag-head">
                  <span className={`chip ${s.cause === "unsupported" ? "red" : "amber"}`}>{s.cause === "unsupported" ? "Stub" : "Not generated"}</span>
                  <code>{s.spec_id}</code> <strong>{s.method}</strong>
                </div>
                <p>{s.reason}</p>
              </li>
            ))}
            {data.uncovered_spec_items.map((u) => (
              <li key={u.id}>
                <div className="flag-head"><span className="chip red">Left out</span> <code>{u.id}</code></div>
                <p>{u.reason}</p>
              </li>
            ))}
            {warnings.map((f, i) => (
              <li key={`w${i}`}>
                <div className="flag-head"><span className={`chip ${severityTone(f.severity)}`}>{f.severity}</span> {f.source_ref && <code>{f.source_ref}</code>}</div>
                <p>{f.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
