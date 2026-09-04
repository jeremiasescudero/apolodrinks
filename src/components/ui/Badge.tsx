type Variant = "success" | "warning" | "danger" | "info" | "muted";

const CLASS_MAP: Record<Variant, string> = {
  success: "b-ok",
  warning: "b-low",
  danger: "b-crit",
  info: "b-info",
  muted: "b-combo",
};

export default function Badge({ children, variant = "muted", style }: { children: React.ReactNode; variant?: Variant; style?: React.CSSProperties }) {
  return <span className={`badge ${CLASS_MAP[variant]}`} style={style}>{children}</span>;
}
