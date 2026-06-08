"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { WORKOUT_PROGRAM } from "@/lib/workoutData";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ExportPage() {
  const { sessions, measurements, userName, authReady, currentStreak, totalWorkouts, totalXP } = useStore();
  const [copied, setCopied] = useState(false);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading your data…</p>
      </div>
    );
  }

  // May 2026
  const maySessions = sessions
    .filter(s => s.date >= "2026-05-01" && s.date <= "2026-05-31")
    .sort((a, b) => a.date.localeCompare(b.date));

  // All sessions
  const allSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  // Measurements sorted
  const sortedMeasurements = [...measurements].sort((a, b) => a.date.localeCompare(b.date));

  // Compute per-exercise weight data from all sessions
  const weightsByExercise: Record<string, number[]> = {};
  allSessions.forEach(s => {
    Object.entries(s.loggedSets).forEach(([key, log]) => {
      const exerciseId = key.split("-").slice(0, -1).join("-");
      if (log.weightUsed && log.weightUsed > 0) {
        if (!weightsByExercise[exerciseId]) weightsByExercise[exerciseId] = [];
        weightsByExercise[exerciseId].push(log.weightUsed);
      }
    });
  });

  const exportData = {
    user: userName,
    exportedAt: new Date().toISOString(),
    summary: {
      totalWorkouts,
      currentStreak,
      totalXP,
      totalSessions: allSessions.length,
      maySessions: maySessions.length,
    },
    maySessions: maySessions.map(s => {
      const day = WORKOUT_PROGRAM.find(d => d.dayNumber === s.dayNumber);
      const setsWithWeights = Object.entries(s.loggedSets)
        .filter(([, log]) => log.weightUsed && log.weightUsed > 0)
        .map(([key, log]) => ({
          key,
          weight: log.weightUsed,
          reps: log.repsCompleted?.filter(Boolean).length ?? 0,
        }));
      return {
        date: s.date,
        dayNumber: s.dayNumber,
        dayName: day?.name,
        completion: s.completionPercent,
        completed: !!s.completedAt,
        rpe: s.overallRpe,
        notes: s.notes,
        weightedSets: setsWithWeights,
      };
    }),
    measurements: sortedMeasurements.map(m => ({
      date: m.date,
      weight: m.weight,
      leftBicep: m.leftBicep,
      rightBicep: m.rightBicep,
      waist: m.waist,
      chest: m.chest,
      hips: m.hips,
      thigh: m.thigh,
    })),
    weightProgress: Object.entries(weightsByExercise).map(([id, weights]) => ({
      exerciseId: id,
      firstWeight: weights[0],
      lastWeight: weights[weights.length - 1],
      maxWeight: Math.max(...weights),
      sessions: weights.length,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Data Export</h1>
        <p className="text-sm text-slate-400">Your workout history and measurements for analysis.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold text-white">{maySessions.length}</p>
          <p className="text-xs text-slate-400 mt-1">Sessions in May</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-white">{allSessions.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total sessions</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-white">{sortedMeasurements.length}</p>
          <p className="text-xs text-slate-400 mt-1">Measurements logged</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-white">
            {sortedMeasurements.length > 0 ? `${sortedMeasurements[sortedMeasurements.length - 1].weight ?? "—"} kg` : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Latest bodyweight</p>
        </div>
      </div>

      {/* May sessions table */}
      {maySessions.length > 0 && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">May Sessions</h2>
          {maySessions.map(s => {
            const day = WORKOUT_PROGRAM.find(d => d.dayNumber === s.dayNumber);
            return (
              <div key={s.id} className="flex items-center gap-3 text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.completionPercent >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {s.completionPercent}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{day?.name ?? `Day ${s.dayNumber}`}</p>
                  <p className="text-xs text-slate-500">{fmt(s.date)}{s.overallRpe ? ` · RPE ${s.overallRpe}` : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Measurements table */}
      {sortedMeasurements.length > 0 && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Body Measurements</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-400">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="text-left pb-2">Date</th>
                  <th className="text-right pb-2">Wt</th>
                  <th className="text-right pb-2">Waist</th>
                  <th className="text-right pb-2">L.Bi</th>
                  <th className="text-right pb-2">R.Bi</th>
                </tr>
              </thead>
              <tbody>
                {sortedMeasurements.map(m => (
                  <tr key={m.id} className="border-b border-white/5 last:border-0">
                    <td className="py-1.5">{m.date}</td>
                    <td className="text-right text-white">{m.weight ?? "—"}</td>
                    <td className="text-right">{m.waist ?? "—"}</td>
                    <td className="text-right">{m.leftBicep ?? "—"}</td>
                    <td className="text-right">{m.rightBicep ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON export */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Full JSON Export</h2>
          <button
            onClick={copy}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 transition-colors"
          >
            {copied ? "Copied ✓" : "Copy JSON"}
          </button>
        </div>
        <pre className="text-[10px] text-slate-400 bg-black/30 rounded-xl p-3 overflow-auto max-h-48 leading-relaxed">
          {json}
        </pre>
      </div>

      {maySessions.length === 0 && sortedMeasurements.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-slate-400 text-sm">No data found. Make sure you&apos;re signed in to the same account you train with.</p>
        </div>
      )}
    </div>
  );
}
