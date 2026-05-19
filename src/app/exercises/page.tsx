"use client";
import { useState, useMemo } from "react";
import { WORKOUT_PROGRAM } from "@/lib/workoutData";
import type { Exercise, ExerciseCategory } from "@/lib/types";
import ExerciseCard from "@/components/ExerciseCard";
import { Dumbbell, Search, Filter } from "lucide-react";

const ALL_EXERCISES: Exercise[] = WORKOUT_PROGRAM.flatMap(day =>
  day.exercises.map(ex => ({ ...ex, dayNumber: day.dayNumber } as Exercise))
).filter((ex, i, arr) => arr.findIndex(e => e.id === ex.id) === i);

const CATEGORIES: ExerciseCategory[] = [
  "biceps", "triceps", "shoulders", "chest", "back", "core", "legs", "cardio", "mobility"
];

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  biceps: "💪 Biceps", triceps: "💪 Triceps", shoulders: "🏋️ Shoulders",
  chest: "🫀 Chest", back: "🦅 Back", core: "⚡ Core",
  legs: "🦵 Legs", cardio: "🏃 Cardio", mobility: "🧘 Mobility", warmup: "🔥 Warm-up"
};

const EQUIPMENT_LABELS: Record<string, string> = {
  dumbbell: "Dumbbell", barbell: "Barbell", kettlebell: "Kettlebell",
  pushup_bracket: "Push-up Bracket", bodyweight: "Bodyweight", elliptical: "Elliptical", none: "None"
};

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<ExerciseCategory | "all">("all");
  const [filterEquip, setFilterEquip] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const allEquipment = [...new Set(ALL_EXERCISES.map(e => e.equipment))];

  const filtered = useMemo(() => {
    return ALL_EXERCISES.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.musclesPrimary.some(m => m.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = filterCat === "all" || ex.category === filterCat;
      const matchesEquip = filterEquip === "all" || ex.equipment === filterEquip;
      return matchesSearch && matchesCat && matchesEquip;
    });
  }, [search, filterCat, filterEquip]);

  // Group by category
  const grouped = useMemo(() => {
    const g: Record<string, Exercise[]> = {};
    filtered.forEach(ex => {
      if (!g[ex.category]) g[ex.category] = [];
      g[ex.category].push(ex);
    });
    return g;
  }, [filtered]);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Dumbbell size={20} className="text-blue-400" /> Exercise Guide
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-all ${showFilters ? "bg-iron-500/20 border-iron-500/30 text-blue-400" : "border-white/10 text-slate-400"}`}
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises or muscles…"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-iron-500/40"
          style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)" }}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-3 animate-slide-up">
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCat("all")}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterCat === "all" ? "bg-iron-500 border-iron-500 text-white" : "border-white/10 text-slate-400 hover:border-iron-500/40"}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterCat === cat ? "bg-iron-500 border-iron-500 text-white" : "border-white/10 text-slate-400 hover:border-iron-500/40"}`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Equipment</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterEquip("all")}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterEquip === "all" ? "bg-iron-500 border-iron-500 text-white" : "border-white/10 text-slate-400 hover:border-iron-500/40"}`}
              >
                All
              </button>
              {allEquipment.map(eq => (
                <button
                  key={eq}
                  onClick={() => setFilterEquip(eq)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterEquip === eq ? "bg-iron-500 border-iron-500 text-white" : "border-white/10 text-slate-400 hover:border-iron-500/40"}`}
                >
                  {EQUIPMENT_LABELS[eq] || eq}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-500">{filtered.length} exercise{filtered.length !== 1 ? "s" : ""}</p>

      {/* Grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Dumbbell size={36} className="mx-auto mb-3 text-slate-700" />
          <p>No exercises match your filters</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, exs]) => (
          <div key={cat} className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{CATEGORY_LABELS[cat as ExerciseCategory] || cat}</span>
              <span className="text-xs text-slate-500 font-normal">{exs.length}</span>
            </h2>
            {exs.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
