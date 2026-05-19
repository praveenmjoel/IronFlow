"use client";
import { useStore } from "@/lib/store";
import { WORKOUT_PROGRAM } from "@/lib/workoutData";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, Flame, Target, Award, Zap, TrendingUp, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ProgressRing from "@/components/ProgressRing";

const COLORS = ["#4a5cf7", "#8b5cf6", "#f59e0b", "#ef4444", "#22c55e", "#14b8a6", "#ec4899"];

export default function AnalyticsPage() {
  const { sessions, currentStreak, longestStreak, totalWorkouts, totalXP, measurements } = useStore();

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  // Completion over time
  const completionData = sorted.map(s => ({
    date: s.date,
    pct: s.completionPercent,
    day: WORKOUT_PROGRAM.find(d => d.dayNumber === s.dayNumber)?.name || `Day ${s.dayNumber}`,
  }));

  // Workout type distribution
  const typeCounts: Record<string, number> = {};
  sessions.forEach(s => {
    const day = WORKOUT_PROGRAM.find(d => d.dayNumber === s.dayNumber);
    if (day) {
      const tag = day.tags[0] || "other";
      typeCounts[tag] = (typeCounts[tag] || 0) + 1;
    }
  });
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // Weekly volume (sessions per week)
  const weeklyData: Record<string, number> = {};
  sessions.forEach(s => {
    const d = new Date(s.date);
    const startOfWeek = new Date(d);
    const day = d.getDay() || 7;
    startOfWeek.setDate(d.getDate() - day + 1);
    const weekKey = startOfWeek.toISOString().split("T")[0];
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });
  const weeklyBarData = Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week: formatDate(week), count }));

  // Avg completion per day type
  const dayAvgData = WORKOUT_PROGRAM.map(day => {
    const daySessions = sessions.filter(s => s.dayNumber === day.dayNumber);
    const avg = daySessions.length > 0
      ? Math.round(daySessions.reduce((a, s) => a + s.completionPercent, 0) / daySessions.length)
      : 0;
    return { name: `D${day.dayNumber}`, label: day.name, avg, count: daySessions.length };
  });

  const overallAvg = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.completionPercent, 0) / sessions.length)
    : 0;

  // Weight progression (from measurements)
  const weightData = [...measurements]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(m => m.weight != null)
    .map(m => ({ date: m.date, weight: m.weight }));

  const bicepData = [...measurements]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(m => m.leftBicep != null)
    .map(m => ({ date: m.date, left: m.leftBicep, right: m.rightBicep }));

  // Achievements
  const achievements = [
    { id: "first", label: "First Workout", icon: "🎯", unlocked: totalWorkouts >= 1, desc: "Complete your first workout" },
    { id: "week", label: "Week Warrior", icon: "🏅", unlocked: totalWorkouts >= 7, desc: "Complete 7 workouts" },
    { id: "streak3", label: "On Fire", icon: "🔥", unlocked: longestStreak >= 3, desc: "3-day streak" },
    { id: "streak7", label: "Iron Will", icon: "⚡", unlocked: longestStreak >= 7, desc: "7-day streak" },
    { id: "perfect", label: "Perfectionist", icon: "💯", unlocked: sessions.some(s => s.completionPercent === 100), desc: "100% completion" },
    { id: "xp500", label: "XP Hunter", icon: "💫", unlocked: totalXP >= 500, desc: "Earn 500 XP" },
    { id: "xp1000", label: "Veteran", icon: "🥇", unlocked: totalXP >= 1000, desc: "Earn 1000 XP" },
    { id: "measure", label: "Data Nerd", icon: "📊", unlocked: measurements.length >= 3, desc: "Log 3 measurements" },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <BarChart3 size={20} className="text-blue-400" /> Analytics
      </h1>

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2"><Flame size={20} className="text-orange-400" /></div>
          <p className="text-2xl font-bold text-white">{currentStreak}</p>
          <p className="text-xs text-slate-400">Current streak</p>
          <p className="text-xs text-slate-600 mt-0.5">Best: {longestStreak} days</p>
        </div>
        <div className="card p-4 text-center">
          <ProgressRing percent={overallAvg} size={56} strokeWidth={5} label={`${overallAvg}%`} />
          <p className="text-xs text-slate-400 mt-2">Avg completion</p>
          <p className="text-xs text-slate-600 mt-0.5">{sessions.length} sessions</p>
        </div>
        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2"><Zap size={20} className="text-amber-400" /></div>
          <p className="text-2xl font-bold text-white">{totalXP}</p>
          <p className="text-xs text-slate-400">Total XP</p>
        </div>
        <div className="card p-4 text-center">
          <div className="flex justify-center mb-2"><Calendar size={20} className="text-emerald-400" /></div>
          <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
          <p className="text-xs text-slate-400">Workouts done</p>
        </div>
      </div>

      {/* Completion over time */}
      {completionData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-blue-400" /> Completion Over Time
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={completionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => formatDate(v)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                labelFormatter={v => formatDate(v as string)}
                formatter={(v) => [`${v}%`, "Completion"]}
              />
              <Line type="monotone" dataKey="pct" stroke="#4a5cf7" strokeWidth={2.5} dot={{ fill: "#4a5cf7", r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly sessions */}
      {weeklyBarData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Sessions Per Week</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weeklyBarData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                formatter={(v) => [v, "Sessions"]}
              />
              <Bar dataKey="count" fill="#4a5cf7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-day performance */}
      {sessions.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Performance by Workout Day</h3>
          <div className="space-y-2.5">
            {dayAvgData.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-6">{d.name}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 truncate flex-1">{d.label}</span>
                    <span className="text-xs font-bold text-blue-400 ml-2">{d.avg}%</span>
                  </div>
                  <div className="progress-bar-track h-2">
                    <div className="progress-bar-fill" style={{ width: `${d.avg}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-600 w-8 text-right">{d.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout type breakdown */}
      {pieData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Workout Types</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={pieData} innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-300 capitalize flex-1">{d.name}</span>
                  <span className="text-xs font-bold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body weight chart */}
      {weightData.length >= 2 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Body Weight Trend</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => formatDate(v)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                labelFormatter={v => formatDate(v as string)}
                formatter={(v) => [`${v} kg`, "Weight"]}
              />
              <Line type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bicep progress */}
      {bicepData.length >= 2 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Bicep Size Trend 💪</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={bicepData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => formatDate(v)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                labelFormatter={v => formatDate(v as string)}
                formatter={(v, name) => [`${v} cm`, name === "left" ? "Left Bicep" : "Right Bicep"]}
              />
              <Line type="monotone" dataKey="left" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="left" />
              <Line type="monotone" dataKey="right" stroke="#6366f1" strokeWidth={2.5} dot={false} name="right" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Achievements */}
      <div className="card p-5">
        <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <Award size={15} className="text-amber-400" /> Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`p-3 rounded-xl border text-center transition-all ${
                a.unlocked
                  ? "bg-amber-500/8 border-amber-500/25"
                  : "bg-white/[0.02] border-white/[0.05] opacity-40"
              }`}
            >
              <div className="text-2xl mb-1">{a.unlocked ? a.icon : "🔒"}</div>
              <p className="text-xs font-semibold text-white">{a.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BarChart3 size={48} className="mx-auto mb-4 text-slate-700" />
          <p>No workout data yet.</p>
          <p className="text-sm mt-1">Complete your first workout to see analytics.</p>
        </div>
      )}
    </div>
  );
}
