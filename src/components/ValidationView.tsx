import type { Validation } from "../types";
import { CheckIcon, CrossIcon } from "./icons";
import { Stats } from "./ui";

const LABEL: Record<string, string> = { ok: "OK", failed: "Failed", skipped: "Skipped", timed_out: "Timed out" };

const HEADLINE: Record<Validation["result"], { title: string; text: string }> = {
  passed: { title: "The app builds", text: "Packages were restored and the project compiled without errors. It has not been run or tested beyond that." },
  build_failed: { title: "The app does not compile yet", text: "The errors below show where. The app is still packaged so you can fix them by hand." },
  restore_failed: { title: "Packages could not be restored", text: "The app was not built. This is usually a network or NuGet problem." },
  timed_out: { title: "The build did not finish in time", text: "Raise DOTNET_TIMEOUT_SEC in .env and run again." },
};

export default function ValidationView({ data }: { data: Validation }) {
  const ok = data.result === "passed";
  const head = HEADLINE[data.result];
  const tail = data.result === "restore_failed" ? data.restore.output_tail : data.build.output_tail;
  return (
    <>
      <section className={`card banner ${ok ? "ok" : "bad"}`} role={ok ? undefined : "alert"}>
        <span className="banner-icon">{ok ? <CheckIcon size={26} /> : <CrossIcon size={26} />}</span>
        <div>
          <h2>{head.title}</h2>
          <p>{head.text}</p>
        </div>
      </section>

      <Stats
        items={[
          { label: "Restore", value: LABEL[data.restore.status] ?? data.restore.status, hint: `${data.restore.seconds}s`, tone: data.restore.status === "ok" ? "green" : data.restore.status === "skipped" ? undefined : "red" },
          { label: "Build", value: LABEL[data.build.status] ?? data.build.status, hint: `${data.build.seconds}s`, tone: data.build.status === "ok" ? "green" : data.build.status === "skipped" ? undefined : "red" },
          { label: "Errors", value: data.errors.length, tone: data.errors.length ? "red" : "green" },
          { label: "Warnings", value: data.warning_count, hint: "compiler warnings", tone: data.warning_count ? "amber" : undefined },
          { label: ".NET SDK", value: data.dotnet_version },
        ]}
      />

      {data.errors.length > 0 && (
        <section className="card">
          <header className="card-head">
            <h2>Compiler errors</h2>
            <span className="chip red">{data.errors.length}</span>
          </header>
          <p className="muted">Each error links to the spec items of the file it came from.</p>
          <div className="table-wrap">
            <table className="procs">
              <thead>
                <tr><th>Code</th><th>Message</th><th>File</th><th>Spec</th></tr>
              </thead>
              <tbody>
                {data.errors.map((e, i) => (
                  <tr key={i}>
                    <td><code>{e.code}</code></td>
                    <td>{e.message}</td>
                    <td>{e.file ? <code>{e.file}{e.line ? `:${e.line}` : ""}</code> : ""}</td>
                    <td>{(e.spec_refs ?? []).map((r) => <code key={r}>{r}</code>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!ok && tail && (
        <section className="card">
          <h2>Last output from dotnet</h2>
          <pre className="code">{tail}</pre>
        </section>
      )}
    </>
  );
}
