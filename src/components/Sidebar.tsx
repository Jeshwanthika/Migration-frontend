import { STEPS, UPLOAD_PAGE, type StepState, type ViewKey } from "../steps";
import { AnalyzeIcon, CheckIcon, CodeIcon, CrossIcon, FileIcon, PackageIcon, ShieldIcon, SpecIcon, UploadIcon, VerifyIcon } from "./icons";

// One icon per pipeline page, in the same order as STEPS.
const ICONS = [FileIcon, AnalyzeIcon, SpecIcon, VerifyIcon, PackageIcon];

interface Props {
  states: StepState[];
  current: ViewKey;
  hasRun: boolean;
  onSelect: (key: ViewKey) => void;
}

export default function Sidebar({ states, current, hasRun, onSelect }: Props) {
  return (
    <aside className="sidebar" aria-label="Migration pipeline">
      <div className="brand">
        <span className="brand-mark"><CodeIcon size={22} /></span>
        <span>
          <span className="brand-name">Legacy <span>Migration</span></span>
          <span className="brand-sub">Platform</span>
        </span>
      </div>

      <nav>
        <p className="side-label">Start</p>
        <ul className="side-steps">
          <li>
            <button
              type="button"
              className={`side-step idle ${current === "upload" ? "selected" : ""}`}
              aria-current={current === "upload" ? "page" : undefined}
              onClick={() => onSelect("upload")}
            >
              <span className="side-icon"><UploadIcon /></span>
              <span className="side-text">{UPLOAD_PAGE.label}</span>
              {current === "upload" && <span className="side-tag">Active</span>}
            </button>
          </li>
        </ul>

        {hasRun && (
          <>
            <p className="side-label">Migration pipeline</p>
            <ul className="side-steps">
              {STEPS.map((step, i) => {
                const state = states[i];
                const Icon = ICONS[i];
                const selected = step.key === current;
                return (
                  <li key={step.key}>
                    <button
                      type="button"
                      className={`side-step ${state} ${selected ? "selected" : ""}`}
                      aria-current={selected ? "page" : undefined}
                      onClick={() => onSelect(step.key)}
                    >
                      <span className="side-icon"><Icon /></span>
                      <span className="side-text">{i + 1}. {step.label}</span>
                      {selected && <span className="side-tag">Active</span>}
                      {!selected && state === "done" && <span className="side-tag ok" title="Done"><CheckIcon size={14} /></span>}
                      {!selected && state === "failed" && <span className="side-tag bad" title="Failed"><CrossIcon size={14} /></span>}
                      {!selected && state === "active" && <span className="side-tag live" title="Running"><span className="live-dot" /></span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      <div className="side-foot">
        <ShieldIcon size={16} />
        <p>Macros are never executed. Only VBA source text is read.</p>
      </div>
    </aside>
  );
}
