"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { WORKOUT_PROGRAM } from "@/lib/workoutData";
import ProgressRing from "@/components/ProgressRing";
import { Flame, Zap, TrendingUp, Calendar, Dumbbell, Activity, ChevronRight, Plus } from "lucide-react";
import { getDayColor, getIntensityLabel, dateIsToday, formatDate } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

function getTodayDayOfWeek() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

function formatStreak(n: number) {
  if (n === 0) return "No streak yet";
  if (n === 1) return "1 day streak 🔥";
  return `${n} day streak 🔥`;
}

export default function Dashboard() {
  const {
    sessions, activeSession, userName, measurements,
    currentStreak, totalWorkouts, totalXP, onboardingDone, completeOnboarding,
  } = useStore();

  const [nameInput, setNameInput] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!onboardingDone) setShowOnboarding(true);
  }, [onboardingDone]);

  const todayDow = getTodayDayOfWeek();
  const todayDay = WORKOUT_PROGRAM[(todayDow - 1) % WORKOUT_PROGRAM.length];
  const todayDate = new Date().toISOString().split("T")[0];
  const todaySession = sessions.find(s => s.date === todayDate);
  const completionPct = activeSession?.completionPercent ?? todaySession?.completionPercent ?? 0;

  // Last 7 days completion data for mini-chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    const s = sessions.find(x => x.date === ds);
    return { date: ds, pct: s?.completionPercent ?? 0 };
  });

  const latestMeasurement = measurements.length > 0
    ? measurements.sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const weeklyCompleted = last7.filter(d => d.pct >= 80).length;

  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <div className="card p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-6">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to IronFlow</h1>
          <p className="text-slate-400 text-sm mb-8">Your personal workout operating system. Precision training, every session.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 text-left mb-1.5 font-medium">Your name</label>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Praveen"
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-iron-500/60 text-sm"
                style={{ background: "#161d2e" }}
                onKeyDown={e => e.key === "Enter" && nameInput.trim() && (completeOnboarding(nameInput.trim()), setShowOnboarding(false))}
              />
            </div>
            <button
              onClick={() => { if (nameInput.trim()) { completeOnboarding(nameInput.trim()); setShowOnboarding(false); } }}
              disabled={!nameInput.trim()}
              className="btn-primary w-full py-3 text-sm disabled:opacity-40"
            >
              Start Training →
            </button>
          </div>

          <p className="text-xs text-slate-600 mt-6">6-day progressive program • Biceps focus • HIIT cardio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">Good {getGreeting()},</p>
          <h1 className="text-2xl font-bold text-white">{userName || "Athlete"} 👋</h1>
        </div>
        <div className="streak-badge flex items-center gap-1">
          <Flame size={13} />
          {currentStreak}d
        </div>
      </div>

      {/* Today's workout card */}
      <div className="card card-hover overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Today&apos;s Workout</p>
              <h2 className="text-lg font-bold text-white">{todayDay.name}</h2>
              <p className="text-sm text-slate-400">{todayDay.focus}</p>
            </div>
            <ProgressRing
              percent={completionPct}
              size={72}
              label={`${completionPct}%`}
              sublabel="done"
              color={completionPct === 100 ? "#22c55e" : "#4a5cf7"}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {todayDay.muscleGroups.map(m => (
              <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-iron-500/15 text-blue-300 border border-iron-500/20 font-medium">{m}</span>
            ))}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getDayColor(todayDay.intensity)} bg-white/5 border border-white/10`}>
              {getIntensityLabel(todayDay.intensity)}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">{todayDay.durationMinutes} min</span>
          </div>

          <Link
            href={`/workout/${todayDay.dayNumber}`}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            {completionPct === 0 ? "Begin Workout" : completionPct === 100 ? "View Completed" : "Continue Workout"}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Flame size={16} className="text-orange-400" />} label="Streak" value={`${currentStreak}d`} sub="current" />
        <StatCard icon={<Dumbbell size={16} className="text-blue-400" />} label="Workouts" value={totalWorkouts} sub="total" />
        <StatCard icon={<Zap size={16} className="text-amber-400" />} label="XP" value={totalXP} sub="earned" />
      </div>

      {/* Weekly progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Weekly Consistency</h3>
          <span className="text-xs text-blue-400 font-medium">{weeklyCompleted}/7 days</span>
        </div>
        <div className="flex gap-1.5 mb-4">
          {last7.map(({ date, pct }) => {
            const isToday = dateIsToday(date);
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-lg transition-all"
                  style={{
                    height: 40,
                    background: pct === 0
                      ? "rgba(255,255,255,0.05)"
                      : pct >= 80
                        ? "rgba(74,92,247,0.8)"
                        : "rgba(74,92,247,0.35)",
                    border: isToday ? "1px solid rgba(74,92,247,0.8)" : "1px solid rgba(255,255,255,0.05)",
                  }}
                />
                <span className="text-[10px] text-slate-500">
                  {new Date(date).toLocaleDateString("en", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
        {last7.some(d => d.pct > 0) && (
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={last7}>
              <Line type="monotone" dataKey="pct" stroke="#4a5cf7" strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                labelFormatter={v => formatDate(v as string)}
                formatter={(v) => [`${v}%`, "Completion"]}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly plan overview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">This Week&apos;s Plan</h3>
          <Link href="/calendar" className="text-xs text-blue-400 flex items-center gap-1">
            Full calendar <ChevronRight size={12} />
          </Link>
        </div>
        <div className="space-y-2">
          {WORKOUT_PROGRAM.map((day, i) => {
            const isCurrent = i + 1 === todayDow;
            return (
              <Link key={day.dayNumber} href={`/workout/${day.dayNumber}`}>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${isCurrent ? "bg-iron-500/12 border border-iron-500/25" : "hover:bg-white/[0.03]"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? "bg-iron-500 text-white" : "bg-white/[0.06] text-slate-400"}`}>
                    {i + 1 === 7 ? "R" : `D${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{day.name}</p>
                    <p className="text-xs text-slate-400 truncate">{day.focus}</p>
                  </div>
                  <span className={`text-xs font-medium ${getDayColor(day.intensity)}`}>
                    {"●".repeat(day.intensity)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Measurements snapshot */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Activity size={16} className="text-violet-400" />
            Body Measurements
          </h3>
          <Link href="/measurements" className="text-xs text-blue-400 flex items-center gap-1">
            Track <Plus size={12} />
          </Link>
        </div>
        {latestMeasurement ? (
          <div className="grid grid-cols-2 gap-3">
            {latestMeasurement.weight && <MeasureCell label="Weight" value={`${latestMeasurement.weight} kg`} />}
            {latestMeasurement.waist && <MeasureCell label="Waist" value={`${latestMeasurement.waist} cm`} />}
            {latestMeasurement.leftBicep && <MeasureCell label="L. Bicep" value={`${latestMeasurement.leftBicep} cm`} />}
            {latestMeasurement.rightBicep && <MeasureCell label="R. Bicep" value={`${latestMeasurement.rightBicep} cm`} />}
          </div>
        ) : (
          <Link href="/measurements">
            <div className="text-center py-6 rounded-xl border border-dashed border-white/10 hover:border-iron-500/30 transition-colors">
              <TrendingUp size={24} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Log your first measurement</p>
            </div>
          </Link>
        )}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Calendar size={16} className="text-emerald-400" />
              Recent Sessions
            </h3>
          </div>
          <div className="space-y-2">
            {sessions.slice(-5).reverse().map(s => {
              const day = WORKOUT_PROGRAM.find(d => d.dayNumber === s.dayNumber);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.completionPercent >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {s.completionPercent >= 80 ? "✓" : `${s.completionPercent}%`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{day?.name || `Day ${s.dayNumber}`}</p>
                    <p className="text-xs text-slate-500">{formatDate(s.date)}</p>
                  </div>
                  <ProgressRing percent={s.completionPercent} size={32} strokeWidth={3} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-600">{sub}</p>
    </div>
  );
}

function MeasureCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-base font-bold text-white">{value}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
