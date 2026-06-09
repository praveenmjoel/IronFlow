"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { MealType } from "@/lib/types";
import { Utensils, Plus, Trash2, Sparkles, ChevronDown, Clock, AlertCircle, Loader2, BookOpen, Apple } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast",     label: "Breakfast",     emoji: "🌅" },
  { value: "lunch",         label: "Lunch",         emoji: "☀️" },
  { value: "dinner",        label: "Dinner",        emoji: "🌙" },
  { value: "snack",         label: "Snack",         emoji: "🍎" },
  { value: "pre-workout",   label: "Pre-Workout",   emoji: "⚡" },
  { value: "post-workout",  label: "Post-Workout",  emoji: "💪" },
];

const DEFAULT_FORM = {
  name: "",
  quantity: "",
  mealType: "breakfast" as MealType,
  time: new Date().toTimeString().slice(0, 5),
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function NutritionPage() {
  const {
    foodEntries, nutritionInsight, nutritionLoading,
    addFoodEntry, removeFoodEntry, setNutritionInsight, setNutritionLoading,
    userName, measurements,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"log" | "coaching">("log");

  const latestWeight = useMemo(() => {
    if (!measurements.length) return null;
    const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]?.weight ?? null;
  }, [measurements]);

  // Group entries by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof foodEntries>();
    [...foodEntries]
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
      .forEach(e => {
        const arr = map.get(e.date) ?? [];
        arr.push(e);
        map.set(e.date, arr);
      });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [foodEntries]);

  async function handleSave() {
    if (!form.name.trim() || !form.quantity.trim()) return;
    setSaving(true);
    await addFoodEntry({
      date: form.date,
      time: form.time,
      name: form.name.trim(),
      quantity: form.quantity.trim(),
      mealType: form.mealType,
      notes: form.notes.trim() || undefined,
    });
    setForm(DEFAULT_FORM);
    setShowForm(false);
    setSaving(false);
  }

  async function runCoaching() {
    if (foodEntries.length === 0) return;
    setNutritionLoading(true);
    setCoachError(null);

    // Send last 50 entries (sorted newest first → reverse for prompt)
    const recent = [...foodEntries]
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
      .slice(0, 50)
      .reverse();

    try {
      const res = await fetch("/api/nutrition-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: recent, userName, latestWeight }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Coaching request failed");
      }
      const coaching = await res.json();
      setNutritionInsight({
        ...coaching,
        id: `nc-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        entriesAnalyzed: recent.length,
      });
      setActiveTab("coaching");
    } catch (e) {
      setCoachError((e as Error).message);
    } finally {
      setNutritionLoading(false);
    }
  }

  const mealEmoji = (type: MealType) => MEAL_TYPES.find(m => m.value === type)?.emoji ?? "🍽️";

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Utensils size={20} className="text-emerald-400" /> Nutrition
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
        >
          <Plus size={15} /> Log Food
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="card p-5 animate-slide-up space-y-4">
          <h3 className="font-semibold text-white">Log Food</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Food / Meal name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 2 boiled eggs + brown bread toast"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Quantity / Serving</label>
            <input
              type="text"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 200g, 1 bowl, 2 pieces"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Meal type</label>
            <div className="grid grid-cols-3 gap-2">
              {MEAL_TYPES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setForm(f => ({ ...f, mealType: m.value }))}
                  className={`px-2 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    form.mealType === m.value
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/[0.04] text-slate-400 border border-white/10"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. home cooked, organic…"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.quantity.trim()}
              className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Entry"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 text-sm text-slate-400 border border-white/10 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coach CTA */}
      {foodEntries.length > 0 && (
        <button
          onClick={runCoaching}
          disabled={nutritionLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))",
            border: "1px solid rgba(16,185,129,0.4)",
            color: "#34d399",
          }}
        >
          {nutritionLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Analysing your nutrition…</>
          ) : (
            <><Sparkles size={16} /> Get AI Nutrition Coaching</>
          )}
        </button>
      )}

      {coachError && (
        <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{coachError}</span>
        </div>
      )}

      {/* Tabs */}
      {(foodEntries.length > 0 || nutritionInsight) && (
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(["log", "coaching"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "log" ? `📋 Food Log (${foodEntries.length})` : "🤖 Coaching"}
            </button>
          ))}
        </div>
      )}

      {/* Food Log */}
      {activeTab === "log" && (
        <>
          {grouped.length === 0 ? (
            <div className="text-center py-16">
              <Utensils size={48} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No food entries yet</p>
              <p className="text-sm text-slate-600">Start logging what you eat to get AI coaching</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-6 px-6 py-3 text-sm">
                Log First Meal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([date, entries]) => (
                <div key={date} className="card p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-2">
                    {entries.map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-xl flex-shrink-0 mt-0.5">{mealEmoji(entry.mealType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{entry.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{entry.quantity}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={10} />{entry.time}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/5">
                              {MEAL_TYPES.find(m => m.value === entry.mealType)?.label}
                            </span>
                          </div>
                          {entry.notes && <p className="text-xs text-slate-600 mt-1 italic">{entry.notes}</p>}
                        </div>
                        <button
                          onClick={() => removeFoodEntry(entry.id)}
                          className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Coaching Tab */}
      {activeTab === "coaching" && (
        <>
          {!nutritionInsight ? (
            <div className="text-center py-12">
              <Sparkles size={40} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No coaching yet</p>
              <p className="text-sm text-slate-600">Log some food entries, then tap the button above to get AI coaching</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Based on {nutritionInsight.entriesAnalyzed} entries</span>
                <span>{new Date(nutritionInsight.generatedAt).toLocaleDateString("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {/* Summary */}
              <div className="card p-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))", border: "1px solid rgba(16,185,129,0.2)" }}>
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <Sparkles size={14} /> Overall Assessment
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{nutritionInsight.overallSummary}</p>
              </div>

              {/* Patterns */}
              {nutritionInsight.patterns?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-blue-400 mb-3">📊 Patterns Observed</h3>
                  <ul className="space-y-2">
                    {nutritionInsight.patterns.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-blue-500 flex-shrink-0">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {nutritionInsight.concerns?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-amber-400 mb-3">⚠️ Areas to Address</h3>
                  <ul className="space-y-2">
                    {nutritionInsight.concerns.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-amber-500 flex-shrink-0">•</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {nutritionInsight.suggestions?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-violet-400 mb-3">✅ Actionable Suggestions</h3>
                  <ul className="space-y-2">
                    {nutritionInsight.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-emerald-500 font-bold flex-shrink-0">{i + 1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended foods */}
              {nutritionInsight.recommendedFoods?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <Apple size={14} /> Recommended Foods
                  </h3>
                  <div className="space-y-3">
                    {nutritionInsight.recommendedFoods.map((food, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-sm font-semibold text-white">{food.name}</p>
                        <p className="text-xs text-emerald-400 mt-0.5">{food.reason}</p>
                        <p className="text-xs text-slate-500 mt-1 italic">💡 {food.howToEat}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipes */}
              {nutritionInsight.recipes?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                    <BookOpen size={14} /> Recipes for You
                  </h3>
                  <div className="space-y-3">
                    {nutritionInsight.recipes.map((recipe, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
                        <button
                          onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
                          className="w-full flex items-center justify-between p-3 text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{recipe.name}</p>
                            <p className="text-xs text-orange-400 mt-0.5">{recipe.bestFor}</p>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-slate-500 transition-transform flex-shrink-0 ml-2 ${expandedRecipe === i ? "rotate-180" : ""}`}
                          />
                        </button>
                        {expandedRecipe === i && (
                          <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-1.5">Ingredients</p>
                              <ul className="space-y-1">
                                {recipe.ingredients.map((ing, j) => (
                                  <li key={j} className="text-xs text-slate-300 flex gap-1.5">
                                    <span className="text-slate-600">·</span>{ing}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-1.5">Steps</p>
                              <ol className="space-y-1">
                                {recipe.steps.map((step, j) => (
                                  <li key={j} className="text-xs text-slate-300 flex gap-1.5">
                                    <span className="text-blue-500 font-bold flex-shrink-0">{j + 1}.</span>{step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-xs text-emerald-400">🌿 {recipe.nutritionNote}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
