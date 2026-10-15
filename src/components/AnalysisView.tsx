import { Fragment, useMemo, useState } from "react";
import type { Analysis, Support } from "../types";
import { Stats, severityTone } from "./ui";

const ROLE_LABEL: Record<string, string> = {
  ui_handler: "UI handler",
  event: "Event",
  calculation: "Calculation",
  data_access: "Data access",
  report: "Report",
  utility: "Utility",
};

const SUPPORT_LABEL: Record<Support, string> = {
  supported: "Supported",
  partial: "Partial",
  unsupported: "Unsupported",
};

export default function AnalysisView({ data }: { data: Analysis }) {
  const [filter, setFilter] = useState<Support | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { supported: 0, partial: 0, unsupported: 0 };
    data.procedures.forEach((p) => (c[p.support] += 1));
    return c;
  }, [data]);

  const rows = data.procedures.filter((p) => filter === "all" || p.support === filter);
  const flags = data.flags;

  return (
    <>
      <Stats
        items={[
          { label: "Procedures", value: data.procedures.length, hint: `in ${data.modules.length} modules`, tone: "purple" },
          { label: "Supported", value: counts.supported, hint: "migrate as they are", tone: "green" },
          { label: "Partial", value: counts.partial, hint: "converted with a warning", tone: "amber" },
          { label: "Unsupported", value: counts.unsupported, hint: "become stubs", tone: "red" },
          { label: "Model usage", value: data.usage.tokens.toLocaleString(), hint: `tokens, ${data.usage.calls} calls` },
        ]}
      />

      <section className="card">
        <h2>Modules</h2>
        <p className="muted">What each code module in the workbook is for.</p>
        <div className="module-grid">
          {data.modules.map((m) => (
            <article key={m.name} className="module-card">
              <div className="module-top">
                <strong>{m.name}</strong>
                <span className="chip blue">{m.type}</span>
              </div>
              <p className="module-summary">{m.summary || "No summary available."}</p>
              <p className="module-meta">{m.procedure_count} procedures, {m.line_count} lines</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <header className="card-head">
          <h2>Procedures</h2>
          <label className="inline push-right">
            Show{" "}
            <select value={filter} onChange={(e) => setFilter(e.target.value as Support | "all")}>
              <option value="all">all procedures</option>
              <option value="supported">supported</option>
              <option value="partial">partial</option>
              <option value="unsupported">unsupported</option>
            </select>
          </label>
        </header>
        <p className="muted">Select a procedure to see its parameters, calls and what it reads and writes.</p>

        {rows.length === 0 ? (
          <p className="muted pad-top">No procedures match this filter.</p>
        ) : (
          <div className="table-wrap">
            <table className="procs">
              <thead>
                <tr>
                  <th>Procedure</th>
                  <th>Module</th>
                  <th>Role</th>
                  <th>Support</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <Fragment key={p.id}>
                    <tr onClick={() => setOpenId(openId === p.id ? null : p.id)} className="clickable">
                      <td>
                        <button type="button" className="link" aria-expanded={openId === p.id}>
                          {p.name}
                        </button>
                        <div className="muted small">{p.kind}, lines {p.start_line}-{p.end_line}</div>
                      </td>
                      <td>{p.module}</td>
                      <td>{ROLE_LABEL[p.role] ?? p.role}</td>
                      <td><span className={`pill ${p.support}`}>{SUPPORT_LABEL[p.support]}</span></td>
                      <td>{p.analyzed ? p.summary : <em>Not analyzed</em>}</td>
                    </tr>
                    {openId === p.id && (
                      <tr className="detail">
                        <td colSpan={5}>
                          <dl>
                            <dt>Reason</dt><dd>{p.support_reason}</dd>
                            <dt>Parameters</dt>
                            <dd>{p.params.length ? p.params.map((a) => `${a.name} As ${a.type}`).join(", ") : "none"}{p.returns ? `, returns ${p.returns}` : ""}</dd>
                            <dt>Calls</dt><dd>{p.calls.join(", ") || "none"}</dd>
                            <dt>Reads</dt><dd>{p.reads.join(", ") || "none"}</dd>
                            <dt>Writes</dt><dd>{p.writes.join(", ") || "none"}</dd>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <header className="card-head">
          <h2>Flags</h2>
          <span className="chip blue">{flags.length}</span>
        </header>
        <p className="muted">Constructs that need a decision. Info flags never change the result of a run.</p>
        {flags.length === 0 ? (
          <p className="muted pad-top">No flags. Nothing in this workbook needs a decision.</p>
        ) : (
          <ul className="flags">
            {flags.map((f, i) => (
              <li key={i}>
                <div className="flag-head">
                  <span className={`chip ${severityTone(f.severity)}`}>{f.severity}</span>
                  {f.source_ref && <code>{f.source_ref}</code>}
                </div>
                <p>{f.reason}</p>
                {f.snippet && <pre className="snippet">{f.snippet}</pre>}
                {f.suggested_action && <p className="muted small">Suggested: {f.suggested_action}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
