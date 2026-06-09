"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { BodyMeasurement } from "@/lib/types";
import { Ruler, Plus, TrendingUp, TrendingDown, Minus, Scale, Heart, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDate } from "@/lib/utils";

type MetricKey = "weight" | "leftBicep" | "rightBicep" | "waist" | "chest" | "hips" | "restingHR";

const METRICS: { key: MetricKey; label: string; unit: string; color: string; icon: string }[] = [
  { key: "weight",     label: "Body Weight",    unit: "kg",  color: "#4a5cf7", icon: "⚖️" },
  { key: "leftBicep",  label: "Left Bicep",     unit: "cm",  color: "#8b5cf6", icon: "💪" },
  { key: "rightBicep", label: "Right Bicep",    unit: "cm",  color: "#6366f1", icon: "💪" },
  { key: "waist",      label: "Waist",          unit: "cm",  color: "#f59e0b", icon: "📏" },
  { key: "chest",      label: "Chest",          unit: "cm",  color: "#ec4899", icon: "📏" },
  { key: "hips",       label: "Hips",           unit: "cm",  color: "#14b8a6", icon: "📏" },
  { key: "restingHR",  label: "Resting HR",     unit: "bpm", color: "#ef4444", icon: "❤️" },
];

const DEFAULT_FORM: Omit<BodyMeasurement, "id"> = {
  date: new Date().toISOString().split("T")[0],
  weight: undefined, leftBicep: undefined, rightBicep: undefined,
  waist: undefined, chest: undefined, hips: undefined, restingHR: undefined, notes: "",
};

export default function MeasurementsPage() {
  const { measurements, addMeasurement, measurementSaveError } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<BodyMeasurement, "id">>(DEFAULT_FORM);
  const [activeChart, setActiveChart] = useState<MetricKey>("weight");

  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  function handleSubmit() {
    if (!form.date) return;
    addMeasurement(form);
    setForm(DEFAULT_FORM);
    setShowForm(false);
  }

  function getDelta(key: MetricKey) {
    if (!latest || !prev) return null;
    const a = latest[key];
    const b = prev[key];
    if (a == null || b == null) return null;
    return (a as number) - (b as number);
  }

  const chartData = sorted.map(m => ({
    date: m.date,
    value: m[activeChart] as number | undefined,
  })).filter(d => d.value != null);

  const activeMetric = METRICS.find(m => m.key === activeChart)!;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      {measurementSaveError && (
        <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          ⚠️ Measurement couldn&apos;t be saved to the cloud: <span className="font-medium">{measurementSaveError}</span>.
          {" "}Your Firestore security rules may have expired — update them in the Firebase Console (Database → Rules) to allow authenticated writes.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Ruler size={20} className="text-violet-400" /> Body Measurements
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
        >
          <Plus size={15} /> Log
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="card p-5 animate-slide-up space-y-4">
          <h3 className="font-semibold text-white">New Measurement</h3>
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
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map(m => (
              <div key={m.key}>
                <label className="text-xs text-slate-400 mb-1 block">{m.icon} {m.label} ({m.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  value={form[m.key] ?? ""}
                  onChange={e => setForm(f => ({ ...f, [m.key]: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="—"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes…"
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none"
              style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="btn-primary flex-1 py-2.5 text-sm">Save Measurement</button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm text-slate-400 border border-white/10 rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* Latest snapshot */}
      {latest && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">
            Latest — {formatDate(latest.date)}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map(m => {
              const val = latest[m.key];
              if (val == null) return null;
              const delta = getDelta(m.key);
              return (
                <div key={m.key} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">{m.icon} {m.label}</p>
                  <p className="text-lg font-bold text-white">{val as number} <span className="text-sm font-normal text-slate-400">{m.unit}</span></p>
                  {delta != null && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${delta < 0 ? (m.key === "waist" ? "text-emerald-400" : "text-red-400") : delta > 0 ? (m.key === "waist" ? "text-red-400" : "text-emerald-400") : "text-slate-500"}`}>
                      {delta < 0 ? <TrendingDown size={11} /> : delta > 0 ? <TrendingUp size={11} /> : <Minus size={11} />}
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)} {m.unit}
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Chart */}
      {measurements.length >= 2 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Progress Chart</h3>
            <div className="relative">
              <select
                value={activeChart}
                onChange={e => setActiveChart(e.target.value as MetricKey)}
                className="appearance-none text-xs text-blue-400 font-medium bg-transparent border border-blue-400/30 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none cursor-pointer"
              >
                {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
            </div>
          </div>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => formatDate(v)} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                  labelFormatter={v => formatDate(v as string)}
                  formatter={(v) => [`${v} ${activeMetric.unit}`, activeMetric.label]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={activeMetric.color}
                  strokeWidth={2.5}
                  dot={{ fill: activeMetric.color, r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">Need at least 2 measurements to show a chart</p>
          )}
        </div>
      )}

      {/* History */}
      {sorted.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">History</h3>
          <div className="space-y-3">
            {[...sorted].reverse().map(m => (
              <div key={m.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{formatDate(m.date)}</span>
                  {m.notes && <span className="text-xs text-slate-500 italic truncate ml-2 max-w-[150px]">{m.notes}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {METRICS.map(metric => {
                    const val = m[metric.key];
                    if (val == null) return null;
                    return (
                      <span key={metric.key} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/5">
                        {metric.icon} {val as number} {metric.unit}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {measurements.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Scale size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No measurements logged yet</p>
          <p className="text-sm text-slate-600">Track your body composition over time</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-6 px-6 py-3 text-sm">
            Log First Measurement
          </button>
        </div>
      )}
    </div>
  );
}
