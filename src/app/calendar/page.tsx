"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { WORKOUT_PROGRAM } from "@/lib/workoutData";
import ProgressRing from "@/components/ProgressRing";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getDayColor, getIntensityLabel } from "@/lib/utils";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function CalendarPage() {
  const { sessions } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = now.toISOString().split("T")[0];

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function getSessionForDate(dateStr: string) {
    return sessions.find(s => s.date === dateStr);
  }

  // Build 7×6 grid cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedSession = selectedDate ? getSessionForDate(selectedDate) : null;
  const selectedDayOfWeek = selectedDate ? new Date(selectedDate + "T12:00:00").getDay() : null;
  const selectedDayNum = selectedDayOfWeek !== null
    ? (selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1) % WORKOUT_PROGRAM.length
    : null;
  const selectedWorkoutDay = selectedDayNum !== null ? WORKOUT_PROGRAM[selectedDayNum] : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar size={20} className="text-blue-400" /> Calendar
        </h1>
      </div>

      {/* Month nav */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-300">
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-white">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-300">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[11px] text-slate-500 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const mm = String(month + 1).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            const dateStr = `${year}-${mm}-${dd}`;
            const session = getSessionForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isPast = dateStr < todayStr;
            const isFuture = dateStr > todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className="relative flex flex-col items-center justify-center rounded-xl transition-all"
                style={{ minHeight: 44 }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? "bg-iron-500 text-white" : ""}
                  ${isToday && !isSelected ? "ring-2 ring-iron-500 text-white" : ""}
                  ${!isSelected && !isToday ? "text-slate-300" : ""}
                  ${isFuture && !isToday ? "text-slate-600" : ""}
                  ${isPast && !session ? "text-slate-600" : ""}
                `}>
                  {day}
                </div>
                {/* Status dot */}
                {session && (
                  <div
                    className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: session.completionPercent >= 80 ? "#22c55e" : "#f59e0b" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Partial</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-iron-500/60 ring-2 ring-iron-500" />Today</span>
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="card p-5 animate-slide-up">
          <p className="text-xs text-slate-400 mb-1">{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>

          {selectedSession ? (
            <>
              <h3 className="font-bold text-white text-base mb-3">
                {WORKOUT_PROGRAM.find(d => d.dayNumber === selectedSession.dayNumber)?.name}
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <ProgressRing percent={selectedSession.completionPercent} size={56} strokeWidth={5} label={`${selectedSession.completionPercent}%`} />
                <div>
                  <p className="text-sm text-white font-medium">{selectedSession.completionPercent}% complete</p>
                  {selectedSession.completedAt
                    ? <p className="text-xs text-emerald-400">✓ Finished</p>
                    : <p className="text-xs text-amber-400">Incomplete</p>
                  }
                  {selectedSession.notes && <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{selectedSession.notes}&rdquo;</p>}
                </div>
              </div>
              <Link href={`/workout/${selectedSession.dayNumber}`} className="btn-primary w-full py-2.5 text-sm text-center block">
                View Workout →
              </Link>
            </>
          ) : selectedWorkoutDay ? (
            <>
              <h3 className="font-bold text-white text-base mb-2">{selectedWorkoutDay.name}</h3>
              <p className="text-sm text-slate-400 mb-3">{selectedWorkoutDay.focus}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedWorkoutDay.muscleGroups.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-iron-500/15 text-blue-300 border border-iron-500/20">{m}</span>
                ))}
                <span className={`text-xs px-2 py-0.5 rounded-full ${getDayColor(selectedWorkoutDay.intensity)} bg-white/5`}>
                  {getIntensityLabel(selectedWorkoutDay.intensity)}
                </span>
              </div>
              {selectedDate >= todayStr ? (
                <Link href={`/workout/${selectedWorkoutDay.dayNumber}`} className="btn-primary w-full py-2.5 text-sm text-center block">
                  {selectedDate === todayStr ? "Start Today&apos;s Workout →" : "Preview Workout →"}
                </Link>
              ) : (
                <p className="text-xs text-slate-500 text-center">Workout was not logged</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Rest day</p>
          )}
        </div>
      )}

      {/* Weekly stats */}
      <div className="card p-5">
        <h3 className="font-semibold text-white text-sm mb-4">All-Time Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-500">Total sessions</p>
            <p className="text-xl font-bold text-white mt-1">{sessions.length}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-500">Completed (≥80%)</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{sessions.filter(s => s.completionPercent >= 80).length}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-500">Avg completion</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.completionPercent, 0) / sessions.length) : 0}%
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-500">This month</p>
            <p className="text-xl font-bold text-violet-400 mt-1">
              {sessions.filter(s => s.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
