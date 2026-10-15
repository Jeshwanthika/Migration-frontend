import { useEffect, useState } from "react";
import { downloadUrl, getReport } from "../api";
import type { PackageInfo } from "../types";
import { PackageIcon } from "./icons";
import { formatBytes } from "./ui";

export default function PackageView({ info, runId }: { info: PackageInfo; runId: string }) {
  const [report, setReport] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    getReport(runId).then((t) => !cancelled && setReport(t)).catch(() => !cancelled && setReport(""));
    return () => {
      cancelled = true;
    };
  }, [runId]);
  const app = info.file_name.replace(/_migration\.zip$/, "");
  return (
    <>
      <section className="card hero">
        <span className="hero-icon"><PackageIcon size={30} /></span>
        <div className="hero-main">
          <h2>{info.file_name}</h2>
          <p className="muted">{formatBytes(info.size_bytes)}. Ready to download.</p>
        </div>
        <a className="button" href={downloadUrl(runId)} download={info.file_name}>Download ZIP</a>
      </section>

      <div className="two-col">
        <section className="card">
          <h2>What is inside</h2>
          <ul className="contents">
            <li><code>MIGRATION_REPORT.md</code><span className="muted">Summary, build result, stubs and warnings. Read this first.</span></li>
            <li><code>app/</code><span className="muted">The ASP.NET Core 8 solution. <code>bin</code>, <code>obj</code> and <code>.env</code> files are never included.</span></li>
            <li><code>docs/</code><span className="muted">Migration spec (Markdown and JSON), code analysis, generation manifest and build results.</span></li>
          </ul>
        </section>

        <section className="card">
          <h2>Next steps</h2>
          <ol className="next-steps">
            <li>Unzip the file and open <code>MIGRATION_REPORT.md</code>.</li>
            <li>Search the code for <code>MIGRATION-TODO</code> to find every stub.</li>
            <li>Run <code>cd app/{app}</code> then <code>dotnet run</code>.</li>
            <li>Review the generated logic before relying on it.</li>
          </ol>
        </section>
      </div>

      {report && (
        <section className="card">
          <h2>Migration report</h2>
          <p className="muted">The same text is inside the ZIP as <code>MIGRATION_REPORT.md</code>.</p>
          <pre className="code report">{report}</pre>
        </section>
      )}
    </>
  );
}
