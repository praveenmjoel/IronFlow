"use client";
interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bg?: string;
  label?: string;
  sublabel?: string;
}
export default function ProgressRing({
  percent, size = 96, strokeWidth = 7,
  color = "#4a5cf7", bg = "rgba(255,255,255,0.08)",
  label, sublabel,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 100) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="progress-ring" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-white font-bold leading-tight" style={{ fontSize: size > 80 ? 18 : 13 }}>{label}</span>
          {sublabel && <span className="text-slate-400 leading-tight" style={{ fontSize: size > 80 ? 11 : 9 }}>{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
