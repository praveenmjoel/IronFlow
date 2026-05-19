"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Wind, Shield } from "lucide-react";
import type { Exercise } from "@/lib/types";

interface Props {
  exercise: Exercise;
  compact?: boolean;
}

export default function ExerciseCard({ exercise, compact }: Props) {
  const [expanded, setExpanded] = useState(false);

  const categoryColors: Record<string, string> = {
    biceps: "bg-blue-500/20 text-blue-300 border-blue-500/25",
    triceps: "bg-violet-500/20 text-violet-300 border-violet-500/25",
    shoulders: "bg-amber-500/20 text-amber-300 border-amber-500/25",
    chest: "bg-rose-500/20 text-rose-300 border-rose-500/25",
    back: "bg-emerald-500/20 text-emerald-300 border-emerald-500/25",
    core: "bg-orange-500/20 text-orange-300 border-orange-500/25",
    legs: "bg-cyan-500/20 text-cyan-300 border-cyan-500/25",
    cardio: "bg-red-500/20 text-red-300 border-red-500/25",
    mobility: "bg-purple-500/20 text-purple-300 border-purple-500/25",
    warmup: "bg-slate-500/20 text-slate-300 border-slate-500/25",
  };
  const catClass = categoryColors[exercise.category] || "bg-slate-500/20 text-slate-300";

  if (compact) {
    return (
      <div className="card card-hover p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catClass}`}>
            {exercise.category}
          </span>
          <span className="text-sm font-medium text-white flex-1">{exercise.name}</span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {expanded && (
          <div className="mt-3 text-sm text-slate-300 animate-slide-up">
            <p className="mb-2">{exercise.description}</p>
            <p className="text-xs text-slate-400"><span className="text-emerald-400 font-medium">Primary:</span> {exercise.musclesPrimary.join(", ")}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${catClass}`}>
            {exercise.category}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/30 font-medium capitalize">
            {exercise.equipment.replace("_", " ")}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/30 font-medium capitalize">
            {exercise.difficulty}
          </span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-200 p-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{exercise.name}</h3>
      <p className="text-sm text-slate-400">
        <span className="text-emerald-400">Primary:</span> {exercise.musclesPrimary.join(", ")}
      </p>
      {exercise.musclesSecondary.length > 0 && (
        <p className="text-sm text-slate-500">
          <span className="text-slate-400">Secondary:</span> {exercise.musclesSecondary.join(", ")}
        </p>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 animate-slide-up">
          <p className="text-sm text-slate-300 leading-relaxed">{exercise.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Do</span>
              </div>
              <ul className="space-y-1">
                {exercise.dos.map((d, i) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <XCircle size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Don&apos;t</span>
              </div>
              <ul className="space-y-1">
                {exercise.donts.map((d, i) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wind size={13} className="text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Breathing</span>
              </div>
              <p className="text-xs text-slate-300">{exercise.breathingCue}</p>
            </div>
            {exercise.safetyNotes && (
              <div className="flex-1 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={13} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Safety</span>
                </div>
                <p className="text-xs text-slate-300">{exercise.safetyNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
