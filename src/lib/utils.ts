import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatWeight(kg: number | null): string {
  if (kg === null) return "BW";
  if (kg === 0) return "Rod only";
  return `${kg} kg`;
}

export function getWeekDates(weeksAgo = 0): string[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1 - weeksAgo * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export function getColorForPace(pace: string) {
  switch (pace) {
    case "easy":     return "text-emerald-400";
    case "moderate": return "text-blue-400";
    case "fast":     return "text-amber-400";
    case "sprint":   return "text-red-400";
    case "recovery": return "text-cyan-400";
    case "cooldown": return "text-violet-400";
    default:         return "text-slate-400";
  }
}

export function getBgForPace(pace: string) {
  switch (pace) {
    case "easy":     return "bg-emerald-500/15 border-emerald-500/25";
    case "moderate": return "bg-blue-500/15 border-blue-500/25";
    case "fast":     return "bg-amber-500/15 border-amber-500/25";
    case "sprint":   return "bg-red-500/15 border-red-500/25";
    case "recovery": return "bg-cyan-500/15 border-cyan-500/25";
    case "cooldown": return "bg-violet-500/15 border-violet-500/25";
    default:         return "bg-slate-500/15 border-slate-500/25";
  }
}

export function getPaceLabel(pace: string) {
  switch (pace) {
    case "easy":     return "Easy";
    case "moderate": return "Moderate";
    case "fast":     return "Fast";
    case "sprint":   return "SPRINT";
    case "recovery": return "Recovery";
    case "cooldown": return "Cool Down";
    default:         return pace;
  }
}

export function getDayColor(intensity: number) {
  if (intensity <= 1) return "text-emerald-400";
  if (intensity <= 2) return "text-blue-400";
  if (intensity <= 3) return "text-amber-400";
  if (intensity <= 4) return "text-orange-400";
  return "text-red-400";
}

export function getIntensityLabel(intensity: number) {
  const labels = ["", "Very Easy", "Easy", "Moderate", "Hard", "Max Effort"];
  return labels[intensity] || "";
}

export function dateIsToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getProgressionSuggestion(
  allRepsCompleted: boolean,
  sessionsAtWeight: number,
  currentWeight: number
): string | null {
  if (allRepsCompleted && sessionsAtWeight >= 2) {
    const nextWeight = Math.round((currentWeight + 0.5) * 2) / 2;
    return `Ready to progress → try ${nextWeight} kg next session`;
  }
  return null;
}
