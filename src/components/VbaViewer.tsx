import { useState } from "react";
import type { VbaModules } from "../types";
import { Stats, severityTone } from "./ui";

export default function VbaViewer({ data }: { data: VbaModules }) {
  const [selected, setSelected] = useState(0);
  const mod = data.modules[selected];
  const lines = data.modules.reduce((sum, m) => sum + m.line_count, 0);
  return (
    <>
      <Stats
        items={[
          { label: "Modules", value: data.modules.length, hint: "code modules found", tone: "purple" },
          { label: "Lines of VBA", value: lines.toLocaleString(), hint: "excluding attributes" },
          { label: "Findings", value: data.findings.length, hint: "from the macro scan" },
        ]}
      />

      <section className="card">
        <h2>Extracted VBA code</h2>
        <p className="muted">Read straight out of the workbook. Nothing was executed.</p>
        {data.modules.length === 0 ? (
          <p className="muted pad-top">No code modules were found in this workbook.</p>
        ) : (
          <div className="viewer explorer">
            <ul className="modules">
              {data.modules.map((m, i) => (
                <li key={m.name}>
                  <button type="button" className={i === selected ? "active" : ""} onClick={() => setSelected(i)}>
                    <strong>{m.name}</strong>
                    <span className="muted small">{m.type}, {m.line_count} lines</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="viewer-main">
              <pre className="code" aria-label={`Source of ${mod.name}`}>{mod.code}</pre>
            </div>
          </div>
        )}
      </section>

      {(data.flags.length > 0 || data.findings.length > 0) && (
        <section className="card">
          <h2>Notes from extraction</h2>
          {data.flags.length > 0 && (
            <ul className="flags">
              {data.flags.map((f, i) => (
                <li key={i}>
                  <div className="flag-head"><span className={`chip ${severityTone(f.severity)}`}>{f.severity}</span> <code>{f.code}</code></div>
                  <p>{f.reason}</p>
                </li>
              ))}
            </ul>
          )}
          {data.findings.length > 0 && (
            <>
              <h3>Macro scan (olevba)</h3>
              <p className="muted">
                olevba is a security scanner. It marks words that malware often uses as &quot;Suspicious&quot;, whatever the code
                around them does. In a normal business workbook these are expected (for example, <code>Open</code> and <code>Print #</code>
                are just the CSV export writing a file). They are shown for information only and do not change the migration.
              </p>
              <ul className="flags">
                {data.findings.map((f, i) => (
                  <li key={i}><div className="flag-head"><span className="chip">Keyword</span> <code>{f.keyword}</code></div><p>{f.description}</p></li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}
