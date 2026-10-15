import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import type { Skill } from "../types";
import { FileIcon, SwapIcon, UploadIcon } from "./icons";

interface Props {
  skills: Skill[];
  busy: boolean;
  error: string | null;
  onSubmit: (skillId: string, file: File) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadForm({ skills, busy, error, onSubmit }: Props) {
  const sources = Array.from(new Set(skills.map((s) => s.source_stack)));
  const [source, setSource] = useState(skills[0]?.source_stack ?? "");
  const targets = skills.filter((s) => s.source_stack === source);
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const skill = skills.find((s) => s.id === skillId);
  const accept = skill?.extensions.join(",") ?? "";
  const kinds = skill?.extensions.join(", ") ?? "";

  const changeSource = (value: string) => {
    setSource(value);
    const first = skills.find((s) => s.source_stack === value);
    if (first) setSkillId(first.id);
    setFile(null);
    if (input.current) input.current.value = "";
  };

  const pick = () => !busy && input.current?.click();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick();
    }
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <>
      <section className="card route-card">
        <header className="card-head">
          <h2 className="eyebrow">Stack transformation route</h2>
          <span className="chip blue">Spec directed</span>
        </header>
        <div className="route">
          <div className="route-end">
            <span className="route-radio" aria-hidden="true" />
            <div className="route-field">
              <p className="route-kicker">Origin / source stack <span className="chip amber">Legacy</span></p>
              <select className="route-select" aria-label="Source technology" value={source} disabled={busy} onChange={(e) => changeSource(e.target.value)}>
                {sources.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          <span className="route-swap" aria-hidden="true"><SwapIcon size={18} /></span>
          <div className="route-end">
            <span className="route-radio on" aria-hidden="true" />
            <div className="route-field">
              <p className="route-kicker">Destination / target stack <span className="chip green">Modernized</span></p>
              <select className="route-select" aria-label="Target technology" value={skillId} disabled={busy} onChange={(e) => { setSkillId(e.target.value); setFile(null); }}>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.target_stack}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      <form
        className="card upload-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (file && skillId) onSubmit(skillId, file);
        }}
      >
        <h2>Upload your file</h2>
        <p className="muted">Supported format: {kinds || "none"}. Only the VBA code inside is migrated, not the sheet data.</p>

        <div
          className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""} ${busy ? "disabled" : ""}`}
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label="Drop a file here or press Enter to browse"
          onClick={pick}
          onKeyDown={onKey}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input ref={input} type="file" accept={accept} disabled={busy} hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <>
              <span className="drop-icon"><FileIcon size={28} /></span>
              <p className="drop-title">{file.name}</p>
              <p className="drop-sub">{formatSize(file.size)}</p>
              <button type="button" className="btn-outline" disabled={busy} onClick={(e) => { e.stopPropagation(); setFile(null); if (input.current) input.current.value = ""; }}>
                Choose a different file
              </button>
            </>
          ) : (
            <>
              <span className="drop-icon"><UploadIcon size={28} /></span>
              <p className="drop-title">Drag &amp; drop your file here</p>
              <p className="drop-sub">or use the traditional file selector</p>
              <button type="button" className="btn-outline" disabled={busy} onClick={(e) => { e.stopPropagation(); pick(); }}>Browse files</button>
            </>
          )}
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="upload-actions">
          <p className="muted small">The VBA source text is sent to the configured model provider for analysis.</p>
          <button type="submit" className="btn-primary" disabled={busy || !file}>
            {busy ? "Working..." : "Start migration"}
          </button>
        </div>
      </form>
    </>
  );
}
