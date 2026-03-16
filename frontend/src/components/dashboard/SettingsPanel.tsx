import { useState } from "react";

interface ToggleProps {
  label: string;
  defaultActive?: boolean;
  active?: boolean;
  onChange?: (active: boolean) => void;
}

const AccessibilityToggle = ({ label, defaultActive = false, active: controlled, onChange }: ToggleProps) => {
  const [uncontrolled, setUncontrolled] = useState(defaultActive);
  const active = controlled ?? uncontrolled;

  const toggle = () => {
    const next = !active;
    if (controlled === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex justify-between items-center w-full py-1 min-h-[48px]"
      role="switch"
      aria-checked={active}
      aria-label={label}
    >
      <span className="font-medium text-sm">{label}</span>
      <div
        className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${
          active ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 bg-background rounded-full transition-all duration-200 shadow-sm ${
            active ? "left-[1.375rem]" : "left-1"
          }`}
        />
      </div>
    </button>
  );
};

interface SettingsPanelProps {
  ttsEnabled: boolean;
  onTtsEnabledChange: (enabled: boolean) => void;
}

const SettingsPanel = ({ ttsEnabled, onTtsEnabledChange }: SettingsPanelProps) => {
  return (
    <div
      className="bg-card border-thick border-border rounded-2xl p-6"
      role="region"
      aria-label="Accessibility settings"
    >
      <h2 className="font-display text-base font-bold mb-4 uppercase tracking-wide">
        Settings
      </h2>
      <div className="space-y-2">
        <AccessibilityToggle label="High Contrast Mode" defaultActive />
        <AccessibilityToggle label="Text-to-Speech" active={ttsEnabled} onChange={onTtsEnabledChange} />
        <AccessibilityToggle label="Sound Effects" defaultActive={false} />
        <AccessibilityToggle label="Large Labels" defaultActive={false} />
      </div>
      <div className="pt-4 mt-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
          Inference Speed
        </p>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full w-3/4 transition-all duration-500" />
        </div>
        <p className="text-[11px] mt-2 font-mono text-muted-foreground">LATENCY: 42ms</p>
      </div>
    </div>
  );
};

export default SettingsPanel;
