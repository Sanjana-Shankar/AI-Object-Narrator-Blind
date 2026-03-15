import { ConnectionStatus } from "@/hooks/useNarrator";

interface StatusBadgeProps {
  status: ConnectionStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config: Record<ConnectionStatus, { bg: string; dot: string; label: string }> = {
    connected: { bg: "bg-success/20 border-success/40", dot: "bg-success", label: "Connected" },
    connecting: { bg: "bg-primary/20 border-primary/40", dot: "bg-primary animate-pulse", label: "Connecting" },
    disconnected: { bg: "bg-muted border-border", dot: "bg-muted-foreground", label: "Disconnected" },
    error: { bg: "bg-destructive/20 border-destructive/40", dot: "bg-destructive", label: "Error" },
  };

  const c = config[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-thick text-xs font-bold uppercase tracking-widest ${c.bg}`}
      role="status"
      aria-live="polite"
    >
      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} aria-hidden="true" />
      {c.label}
    </div>
  );
};

export default StatusBadge;
