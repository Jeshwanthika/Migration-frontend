import type { ReactNode } from "react";

export interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "green" | "amber" | "red" | "blue" | "purple";
}

export function Stats({ items }: { items: Stat[] }) {
  return (
    <div className="stats">
      {items.map((s) => (
        <div key={s.label} className={`stat ${s.tone ?? ""}`}>
          <p className="stat-label">{s.label}</p>
          <p className="stat-value">{s.value}</p>
          {s.hint && <p className="stat-hint">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, tone, action }: { icon: ReactNode; title: string; text: string; tone?: "red" | "busy"; action?: ReactNode }) {
  return (
    <section className={`card empty ${tone ?? ""}`}>
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      {action}
    </section>
  );
}

export function severityTone(sev: string): string {
  return sev === "Blocker" ? "red" : sev === "Warning" ? "amber" : "blue";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
