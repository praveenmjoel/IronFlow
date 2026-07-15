"use client";
import { useState } from "react";
import { Activity, PersonStanding, Heart } from "lucide-react";

/* ─── Data ─── */

const PHASES = ["Wk 1–2", "Wk 3–4", "Wk 5–6", "Wk 7–8"] as const;

type Stage = { name: string; dur: string; res: number; paces: [number, number, number, number] };

const RES: Record<number, { pill: string; dot: string }> = {
  2:  { pill: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", dot: "#34d399" },
  3:  { pill: "bg-green-500/15 text-green-400 border border-green-500/25",       dot: "#4ade80" },
  4:  { pill: "bg-amber-500/15 text-amber-400 border border-amber-500/25",       dot: "#fbbf24" },
  5:  { pill: "bg-orange-500/15 text-orange-400 border border-orange-500/25",    dot: "#fb923c" },
  10: { pill: "bg-red-500/15 text-red-400 border border-red-500/25",             dot: "#f87171" },
  11: { pill: "bg-rose-600/15 text-rose-400 border border-rose-600/25",          dot: "#fb7185" },
};

const HIIT: Stage[] = [
  { name: "Easy Warm-up",       dur: "2:00",    res: 3,  paces: [5.5, 5.8, 6.2, 6.5] },
  { name: "Warm-up Build",      dur: "2:00",    res: 4,  paces: [5.5, 5.8, 6.2, 6.7] },
  { name: "Warm-up Push",       dur: "1:00",    res: 5,  paces: [5.0, 5.3, 5.7, 6.2] },
  { name: "Sprint Rds 1, 2, 6", dur: "1:00 ×3", res: 10, paces: [4.8, 5.0, 5.3, 5.7] },
  { name: "Sprint Rds 3, 4, 5", dur: "1:00 ×3", res: 11, paces: [4.2, 4.5, 4.8, 5.3] },
  { name: "Recovery",           dur: "2:00 ×6", res: 4,  paces: [5.0, 5.3, 5.8, 6.3] },
  { name: "Cool Down",          dur: "5:00",    res: 2,  paces: [6.0, 6.2, 6.5, 6.8] },
];

const FAT_BURN: Stage[] = [
  { name: "Warm-up",       dur: "5:00",  res: 3, paces: [5.5, 5.8, 6.2, 6.5] },
  { name: "Fat Burn Zone", dur: "25:00", res: 5, paces: [5.0, 5.3, 5.7, 6.2] },
  { name: "Cool Down",     dur: "5:00",  res: 2, paces: [6.0, 6.2, 6.5, 6.8] },
];

type RunRow = { label: string; vals: [string, string, string, string] };
type RunDay = { day: number; name: string; type: string; typeStyle: string; gymDay: string; rows: RunRow[]; note: string };

const RUN_DAYS: RunDay[] = [
  {
    day: 1, name: "Interval Run", type: "Interval",
    typeStyle: "text-orange-400 bg-orange-500/10 border border-orange-500/30",
    gymDay: "Cardio HIIT + Abs",
    rows: [
      { label: "Format",   vals: ["4 × 400 m",  "5 × 400 m",  "4 × 600 m",  "5 × 600 m"] },
      { label: "Pace",     vals: ["6:30 /km",   "6:20 /km",   "6:10 /km",   "5:50 /km"] },
      { label: "Distance", vals: ["~3.5 km",    "~4.0 km",    "~4.5 km",    "~5.5 km"] },
      { label: "Time",     vals: ["~30 min",    "~33 min",    "~36 min",    "~42 min"] },
    ],
    note: "90s walk recovery between intervals. Core finisher: plank 3×45s, leg raises 3×12, bicycle crunches 3×15.",
  },
  {
    day: 2, name: "Easy Aerobic Run", type: "Easy",
    typeStyle: "text-green-400 bg-green-500/10 border border-green-500/30",
    gymDay: "Biceps Focus + Upper Body",
    rows: [
      { label: "Distance", vals: ["3.0 km",    "3.5 km",    "4.0 km",    "5.0 km"] },
      { label: "Pace",     vals: ["8:30 /km",  "8:15 /km",  "8:00 /km",  "7:45 /km"] },
      { label: "Time",     vals: ["~26 min",   "~29 min",   "~32 min",   "~39 min"] },
    ],
    note: "Conversational pace — full sentences. Zone 2 effort (~120–140 bpm).",
  },
  {
    day: 3, name: "Zone 2 Steady Run", type: "Zone 2",
    typeStyle: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30",
    gymDay: "Fat Burn Cardio + Core",
    rows: [
      { label: "Distance", vals: ["4.0 km",    "5.0 km",    "6.0 km",    "7.0 km"] },
      { label: "Pace",     vals: ["8:30 /km",  "8:15 /km",  "8:00 /km",  "7:45 /km"] },
      { label: "Time",     vals: ["~34 min",   "~41 min",   "~48 min",   "~54 min"] },
    ],
    note: "Keep HR 125–145. If pace drops to stay in zone, let it. Core finisher: plank 3×45s, dead bug 3×10/side.",
  },
  {
    day: 4, name: "Tempo Run", type: "Tempo",
    typeStyle: "text-blue-400 bg-blue-500/10 border border-blue-500/30",
    gymDay: "Biceps Volume + Chest",
    rows: [
      { label: "Structure",  vals: ["2 + 2 + 1 km",   "2 + 2.5 + 1 km", "2 + 3 + 1 km",   "2 + 3.5 + 1 km"] },
      { label: "Tempo Pace", vals: ["7:30 /km",        "7:15 /km",       "7:00 /km",        "6:45 /km"] },
      { label: "Distance",   vals: ["5.0 km",          "5.5 km",         "6.0 km",          "6.5 km"] },
      { label: "Time",       vals: ["~37 min",         "~40 min",        "~43 min",         "~46 min"] },
    ],
    note: "Tempo = comfortably hard (3–4 words per sentence). Jog segments at 9:00 /km. Build into first tempo km.",
  },
  {
    day: 5, name: "Fartlek Run", type: "Fartlek",
    typeStyle: "text-red-400 bg-red-500/10 border border-red-500/30",
    gymDay: "HIIT Cardio + Abs",
    rows: [
      { label: "Format",   vals: ["2:00e / 1:00h ×6", "2:00e / 1:30h ×6", "1:30e / 1:30h ×9", "1:30e / 2:00h ×9"] },
      { label: "Time",     vals: ["~20 min",           "~25 min",           "~28 min",           "~32 min"] },
      { label: "Distance", vals: ["~2.8 km",           "~3.5 km",           "~4.0 km",           "~4.5 km"] },
    ],
    note: "Hard efforts at ~80% max — controlled, not a sprint. Easy jog at 8:30–9:00 /km. Just a watch needed. Core finisher same as Day 1.",
  },
  {
    day: 6, name: "Easy Run + Strides", type: "Strides",
    typeStyle: "text-violet-400 bg-violet-500/10 border border-violet-500/30",
    gymDay: "Barbell Strength Day",
    rows: [
      { label: "Easy Run", vals: ["3.0 km @ 8:30", "3.5 km @ 8:15", "4.0 km @ 8:00", "5.0 km @ 7:45"] },
      { label: "Strides",  vals: ["4 × 80 m",      "5 × 100 m",     "6 × 100 m",     "6 × 100 m"] },
      { label: "Time",     vals: ["~28 min",        "~32 min",       "~36 min",       "~42 min"] },
    ],
    note: "Strides at end of easy run. 70–80% max speed, smooth. 60s walk recovery between strides.",
  },
  {
    day: 7, name: "Recovery Walk / Jog", type: "Recovery",
    typeStyle: "text-teal-400 bg-teal-500/10 border border-teal-500/30",
    gymDay: "Knee Prehab + Recovery",
    rows: [
      { label: "Pace",     vals: ["9:30 /km",  "9:00 /km",  "8:45 /km",  "8:30 /km"] },
      { label: "Time",     vals: ["20 min",    "25 min",    "30 min",    "30 min"] },
      { label: "Distance", vals: ["~2.0 km",   "~2.8 km",   "~3.4 km",   "~3.5 km"] },
    ],
    note: "Do knee care BEFORE and AFTER. Slow only — walk the whole session if knees ache.",
  },
];

const KNEE_CARE = [
  { name: "Terminal Knee Extensions", detail: "2 × 15 each leg. Band behind knee, stand, straighten fully." },
  { name: "Clamshells",               detail: "2 × 15 each side. Side-lying, lift knee without rolling hips." },
  { name: "Glute Bridge",             detail: "2 × 15. Supine, drive hips up, squeeze glutes at top." },
  { name: "Wall Sit",                 detail: "2 × 30 sec. Thighs parallel to floor, back flat." },
  { name: "Single-Leg Calf Raise",    detail: "2 × 12 each. Step edge, 3-sec eccentric down." },
  { name: "Quad Stretch",             detail: "30 sec each leg. Heel to glute, hand on wall." },
  { name: "Calf + Achilles Stretch",  detail: "30 sec each: straight-leg calf, then bent-knee Achilles." },
  { name: "IT Band / Hip Cross",      detail: "30 sec each side. Cross-leg forward bend or figure-4." },
  { name: "Hip Flexor Stretch",       detail: "30 sec each side. Low lunge, drive hips forward." },
];

/* ─── Sub-components ─── */

function PhasePicker({ phase, setPhase }: { phase: number; setPhase: (n: number) => void }) {
  return (
    <div className="flex gap-2">
      {PHASES.map((label, i) => (
        <button
          key={i}
          onClick={() => setPhase(i)}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            phase === i
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EllipticalTable({ stages, phase, title }: { stages: Stage[]; phase: number; title: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
      </div>
      <div className="divide-y divide-white/[0.05]">
        {stages.map((s) => {
          const rs = RES[s.res];
          return (
            <div key={s.name} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-1.5 h-8 rounded-full flex-shrink-0"
                style={{ background: rs.dot }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-tight">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.dur}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${rs.pill}`}>
                R{s.res}
              </span>
              <div className="text-right">
                <p className="text-lg font-bold text-indigo-300 tabular-nums leading-none">
                  {s.paces[phase].toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-500">km/h</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RunDayCard({ day, phase }: { day: RunDay; phase: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
          Day {day.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{day.name}</p>
          <p className="text-[11px] text-slate-500 truncate">Replaces: {day.gymDay}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${day.typeStyle}`}>
          {day.type}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {day.rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex-shrink-0">
              {row.label}
            </span>
            <span className="text-sm font-semibold text-white text-right tabular-nums">
              {row.vals[phase]}
            </span>
          </div>
        ))}
        <p className="text-[11px] text-slate-500 pt-2 border-t border-white/[0.05] leading-relaxed">
          {day.note}
        </p>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function TrainingPlanPage() {
  const [phase, setPhase] = useState(0);
  const [tab, setTab] = useState<"elliptical" | "running">("elliptical");

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity size={20} className="text-indigo-400" />
          Training Plan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Current max: R4 = 6.7 km/h · R10 = 5.5 km/h · Goal: make today&apos;s max feel easy by Wk 8
        </p>
      </div>

      {/* Phase selector */}
      <PhasePicker phase={phase} setPhase={setPhase} />

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
        {(["elliptical", "running"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t === "elliptical" ? "🚴 Elliptical" : "🏃 Running"}
          </button>
        ))}
      </div>

      {/* Elliptical section */}
      {tab === "elliptical" && (
        <div className="space-y-4 animate-fade-in">
          <div className="px-3 py-2 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
            <p className="text-xs text-indigo-300 leading-relaxed">
              Phase {phase + 1} targets shown. <span className="font-semibold">Don&apos;t push to your old max on early phases</span> — your R4 max (6.7) and R10 max (5.5) are the Week 7–8 sprint targets.
            </p>
          </div>
          <EllipticalTable stages={HIIT} phase={phase} title="HIIT Session · Days 1 & 5 · ~35 min" />
          <EllipticalTable stages={FAT_BURN} phase={phase} title="Fat Burn Session · Day 3 · 35 min" />
        </div>
      )}

      {/* Running section */}
      {tab === "running" && (
        <div className="space-y-4 animate-fade-in">
          <div className="px-3 py-2 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
            <p className="text-xs text-indigo-300 leading-relaxed">
              Every run: 5 min walk warm-up → run → 5 min walk → knee care below. Pace is in <span className="font-semibold">min/km</span> (larger = easier).
            </p>
          </div>

          {RUN_DAYS.map((d) => <RunDayCard key={d.day} day={d} phase={phase} />)}

          {/* Knee Care */}
          <div className="card overflow-hidden border-amber-500/20">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/15 bg-amber-500/5">
              <Heart size={15} className="text-amber-400" />
              <p className="text-sm font-semibold text-amber-400">Knee Care Protocol</p>
              <span className="ml-auto text-[11px] text-slate-500">~10 min · after every run</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {KNEE_CARE.map((ex, i) => (
                <div key={ex.name} className="flex gap-3 px-4 py-3">
                  <span className="text-[11px] font-bold text-amber-500 w-5 flex-shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{ex.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ex.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mx-4 mb-4 mt-1 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <span className="font-semibold">Stop and rest:</span> sharp pain around the kneecap, swelling after a run, or a locking sensation. If knees feel off, walk the session and do the full routine instead.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
