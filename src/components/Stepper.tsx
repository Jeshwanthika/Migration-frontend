import { TRACK, type StepState, type ViewKey } from "../steps";
import { CheckIcon, CrossIcon } from "./icons";

interface Props {
  states: StepState[]; // one per TRACK item
  current: ViewKey;
  onSelect: (key: ViewKey) => void;
}

export default function Stepper({ states, current, onSelect }: Props) {
  // Two stages can open the same page; mark only the first of them as the current one.
  const selectedIndex = TRACK.findIndex((t) => t.view === current);
  return (
    <ol className="stepper" aria-label="Progress through the pipeline">
      {TRACK.map((step, i) => {
        const state = states[i];
        const selected = i === selectedIndex;
        return (
          <li key={step.label} className={`stepper-item ${state} ${selected ? "selected" : ""}`}>
            <button type="button" className="stepper-btn" onClick={() => onSelect(step.view)} aria-current={selected ? "page" : undefined}>
              <span className="stepper-dot">
                {state === "done" ? <CheckIcon size={14} /> : state === "failed" ? <CrossIcon size={14} /> : i + 1}
              </span>
              <span className="stepper-label">{step.label}</span>
            </button>
            {i < TRACK.length - 1 && <span className={`stepper-line ${state === "done" ? "done" : ""}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
