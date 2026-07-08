"use client";
import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { WORKOUT_PROGRAM } from "@/lib/workoutData";
import type { Exercise, Set, WarmupStep, EllipticalInterval } from "@/lib/types";
import RestTimer from "@/components/RestTimer";
import ExerciseCard from "@/components/ExerciseCard";
import ProgressRing from "@/components/ProgressRing";
import { ArrowLeft, Check, Timer, ChevronDown, ChevronUp, Dumbbell, Zap, CheckCircle2, Play, SkipForward, Info } from "lucide-react";
import { formatDuration, formatTimer, formatWeight, getColorForPace, getBgForPace, getPaceLabel } from "@/lib/utils";

interface PageProps { params: Promise<{ day: string }> }

type Phase = "warmup" | "main" | "cooldown" | "complete";

export default function WorkoutPage({ params }: PageProps) {
  const { day: dayParam } = use(params);
  const dayNumber = parseInt(dayParam, 10);
  const router = useRouter();

  const workoutDay = WORKOUT_PROGRAM.find(d => d.dayNumber === dayNumber);

  const {
    activeSession, startWorkout, updateWarmupCheck, updateCooldownCheck,
    toggleRepCheck, toggleIntervalComplete, completeWorkout, abandonWorkout,
  } = useStore();

  const [phase, setPhase] = useState<Phase>("warmup");
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [completionModal, setCompletionModal] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [timedSetRunning, setTimedSetRunning] = useState(false);
  const [timedSetRemaining, setTimedSetRemaining] = useState(0);
  const timedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeSession || activeSession.dayNumber !== dayNumber) {
      startWorkout(dayNumber);
    }
  }, [dayNumber, activeSession, startWorkout]);

  if (!workoutDay) return (
    <div className="p-6 text-center text-slate-400">
      Day {dayNumber} not found. <button onClick={() => router.back()} className="text-blue-400 underline">Go back</button>
    </div>
  );

  if (!activeSession) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="text-slate-400 text-sm">Loading workout…</div>
    </div>
  );

  const completionPct = activeSession.completionPercent;
  const exercises = workoutDay.exercises;
  const elliptical = workoutDay.elliptical;

  function isWarmupChecked(id: string) { return !!(activeSession?.warmupChecked[id]); }
  function isCooldownChecked(id: string) { return !!(activeSession?.cooldownChecked[id]); }
  function isIntervalDone(id: string) { return activeSession?.loggedIntervals.some(l => l.intervalId === id && l.completed) ?? false; }
  function getRepChecked(exId: string, setId: string, repIdx: number) {
    const key = `${exId}-${setId}`;
    return !!(activeSession?.loggedSets[key]?.repsCompleted?.[repIdx]);
  }
  function isTimedSetDone(exId: string, setId: string) {
    const key = `${exId}-${setId}`;
    return !!(activeSession?.loggedSets[key]?.repsCompleted?.[0]);
  }
  function allRepsForSet(exId: string, set: Set) {
    if (set.targetDuration) return isTimedSetDone(exId, set.id);
    return Array.from({ length: set.targetReps || 0 }, (_, i) => getRepChecked(exId, set.id, i)).every(Boolean);
  }

  function handleTimedSet(ex: Exercise, set: Set) {
    if (timedSetRunning) return;
    const dur = set.targetDuration!;
    setTimedSetRemaining(dur);
    setTimedSetRunning(true);
    timedIntervalRef.current = setInterval(() => {
      setTimedSetRemaining(r => {
        if (r <= 1) {
          clearInterval(timedIntervalRef.current!);
          setTimedSetRunning(false);
          toggleRepCheck(ex.id, set.id, 0);
          triggerRest(set.restSeconds);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function triggerRest(seconds: number) {
    setRestSeconds(seconds);
    setShowRestTimer(true);
  }

  function scrollToPhase() {
    setTimeout(() => phaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 glass border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { abandonWorkout(); router.back(); }} className="text-slate-400 hover:text-white p-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{workoutDay.name}</h1>
            <p className="text-xs text-slate-400">{workoutDay.durationMinutes} min • Day {dayNumber}</p>
          </div>
          <ProgressRing percent={completionPct} size={40} strokeWidth={3} label={`${completionPct}%`} />
        </div>
        {/* Phase tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: "warmup", label: "Warm-up" },
            { id: "main",   label: workoutDay.elliptical ? "Workout + Cardio" : "Workout" },
            { id: "cooldown", label: "Cool Down" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setPhase(id as Phase); scrollToPhase(); }}
              className={`workout-phase-tab whitespace-nowrap flex-shrink-0 ${phase === id ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={phaseRef} className="px-4 py-5 space-y-5">
        {/* WARMUP PHASE */}
        {phase === "warmup" && (
          <div className="space-y-3 animate-slide-up">
            <SectionHeader icon={<Zap size={16} className="text-amber-400" />} title="Warm-up" subtitle={`${workoutDay.warmup.length} steps`} />
            <div className="space-y-2">
              {workoutDay.warmup.map((step: WarmupStep, i) => (
                <WarmupStepRow
                  key={step.id}
                  step={step}
                  index={i + 1}
                  checked={isWarmupChecked(step.id)}
                  onChange={v => updateWarmupCheck(step.id, v)}
                />
              ))}
            </div>
            <button
              onClick={() => { setPhase("main"); scrollToPhase(); }}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-4"
            >
              Warm-up Done → Begin Workout <ChevronDown size={16} />
            </button>
          </div>
        )}

        {/* MAIN PHASE */}
        {phase === "main" && (
          <div className="space-y-5 animate-slide-up">
            {/* Exercises */}
            {exercises.length > 0 && (
              <div className="space-y-4">
                <SectionHeader icon={<Dumbbell size={16} className="text-blue-400" />} title="Main Workout" subtitle={`${exercises.length} exercises`} />
                {exercises.map((ex, exIdx) => (
                  <ExerciseSectionBlock
                    key={ex.id}
                    exercise={ex}
                    exIdx={exIdx}
                    expanded={expandedExercise === ex.id}
                    onToggleExpand={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}
                    getRepChecked={getRepChecked}
                    allRepsForSet={allRepsForSet}
                    isTimedSetDone={isTimedSetDone}
                    timedSetRunning={timedSetRunning}
                    timedSetRemaining={timedSetRemaining}
                    onToggleRep={(setId, repIdx) => toggleRepCheck(ex.id, setId, repIdx)}
                    onTimedSet={set => handleTimedSet(ex, set)}
                    onTriggerRest={triggerRest}
                    showRestTimer={showRestTimer}
                    restSeconds={restSeconds}
                    onRestDone={() => setShowRestTimer(false)}
                    activeSetIdx={activeSetIdx}
                    setActiveSetIdx={setActiveSetIdx}
                    isActiveExercise={activeExerciseIdx === exIdx}
                    onActivate={() => setActiveExerciseIdx(exIdx)}
                  />
                ))}
              </div>
            )}

            {/* Elliptical session */}
            {elliptical && (
              <div className="space-y-4">
                <SectionHeader icon={<Activity size={16} className="text-orange-400" />} title={elliptical.name} subtitle={`${elliptical.totalMinutes} min • ~${elliptical.estimatedCalories} kcal`} />
                <div className="space-y-2">
                  {elliptical.intervals.map((interval: EllipticalInterval, i) => (
                    <EllipticalIntervalRow
                      key={interval.id}
                      interval={interval}
                      index={i + 1}
                      done={isIntervalDone(interval.id)}
                      onToggle={() => toggleIntervalComplete(interval.id)}
                    />
                  ))}
                </div>
                <div className="card p-4 bg-orange-500/5 border-orange-500/15">
                  <p className="text-xs text-orange-300 font-medium mb-1">Estimated total</p>
                  <div className="flex gap-4">
                    <span className="text-sm text-white font-bold">{elliptical.totalMinutes} minutes</span>
                    <span className="text-sm text-white font-bold">~{elliptical.estimatedCalories} calories</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { setPhase("cooldown"); scrollToPhase(); }}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-2"
            >
              Workout Done → Cool Down <ChevronDown size={16} />
            </button>
          </div>
        )}

        {/* COOLDOWN PHASE */}
        {phase === "cooldown" && (
          <div className="space-y-3 animate-slide-up">
            <SectionHeader icon={<Timer size={16} className="text-violet-400" />} title="Cool Down & Stretch" subtitle={`${workoutDay.cooldown.length} steps`} />
            {workoutDay.cooldown.length > 0 ? (
              <div className="space-y-2">
                {workoutDay.cooldown.map((step: WarmupStep, i) => (
                  <WarmupStepRow
                    key={step.id}
                    step={step}
                    index={i + 1}
                    checked={isCooldownChecked(step.id)}
                    onChange={v => updateCooldownCheck(step.id, v)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Active recovery day — rest well!</p>
            )}

            {/* Notes */}
            <div className="card p-4">
              <label className="text-xs text-slate-400 font-medium block mb-2">Session notes (optional)</label>
              <textarea
                value={workoutNotes}
                onChange={e => setWorkoutNotes(e.target.value)}
                placeholder="How did it feel? Any PRs? Adjustments needed?"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-iron-500/40"
                style={{ background: "#161d2e", border: "1px solid rgba(255,255,255,0.08)" }}
                rows={3}
              />
            </div>

            <button
              onClick={() => setCompletionModal(true)}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Complete Workout
            </button>
          </div>
        )}
      </div>

      {/* Completion modal */}
      {completionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="card p-8 w-full max-w-sm text-center animate-bounce-in">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-white mb-1">Workout Complete!</h2>
            <p className="text-slate-400 text-sm mb-6">{completionPct}% completion</p>
            <ProgressRing percent={completionPct} size={100} strokeWidth={8} label={`${completionPct}%`} sublabel="done" color={completionPct >= 80 ? "#22c55e" : "#4a5cf7"} />
            <div className="mt-6 space-y-3">
              <button
                onClick={() => { completeWorkout(workoutNotes); router.push("/"); }}
                className="btn-primary w-full py-3 text-sm"
              >
                Save & Go Home
              </button>
              <button
                onClick={() => setCompletionModal(false)}
                className="w-full py-3 text-sm text-slate-400 hover:text-white"
              >
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-bold text-white">{title}</h2>
      <span className="text-xs text-slate-500 ml-auto">{subtitle}</span>
    </div>
  );
}

function playDoneSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const beep = (freq: number, start: number, dur: number, vol = 0.4) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    beep(880, 0,    0.15);
    beep(1100, 0.18, 0.15);
    beep(1320, 0.36, 0.3);
  } catch { /* audio not supported */ }
}

function WarmupStepRow({ step, index, checked, onChange }: {
  step: WarmupStep; index: number; checked: boolean; onChange: (v: boolean) => void;
}) {
  const hasDuration = !!step.durationSeconds;
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(step.durationSeconds ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          playDoneSound();
          onChange(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function handleToggleTimer(e: React.MouseEvent) {
    e.stopPropagation();
    if (running) {
      clearInterval(intervalRef.current!);
      setRunning(false);
    } else {
      if (remaining === 0) setRemaining(step.durationSeconds!);
      setRunning(true);
    }
  }

  function handleReset(e: React.MouseEvent) {
    e.stopPropagation();
    clearInterval(intervalRef.current!);
    setRunning(false);
    setRemaining(step.durationSeconds!);
  }

  const progress = hasDuration && step.durationSeconds
    ? ((step.durationSeconds - remaining) / step.durationSeconds) * 100
    : 0;

  return (
    <div
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${checked ? "bg-emerald-500/8 border-emerald-500/25" : "bg-white/[0.02] border-white/[0.06]"}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onChange(!checked)}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}
      >
        {checked && <Check size={12} className="text-white" />}
      </button>

      {/* Label + note */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${checked ? "line-through text-slate-500" : "text-white"}`}>
          {step.activity}
        </span>
        {step.reps && (
          <span className="text-xs text-slate-400 ml-2">{step.reps} reps</span>
        )}
        {step.note && <p className="text-xs text-slate-500 mt-0.5 truncate">{step.note}</p>}
        {/* Progress bar when timer is running */}
        {hasDuration && running && (
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Timer controls */}
      {hasDuration && !checked && (
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {running ? (
            <>
              <span className="text-base font-mono font-bold text-amber-300 w-10 text-right">
                {formatTimer(remaining)}
              </span>
              <button
                onClick={handleToggleTimer}
                className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                pause
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleTimer}
                className="flex items-center gap-1 text-xs text-amber-400 border border-amber-400/30 rounded-lg px-2.5 py-1.5 hover:bg-amber-500/10 transition-colors font-medium"
              >
                <Play size={11} />
                {remaining === step.durationSeconds ? formatTimer(remaining) : formatTimer(remaining)}
              </button>
              {remaining !== step.durationSeconds && remaining > 0 && (
                <button onClick={handleReset} className="text-[10px] text-slate-600 hover:text-slate-400">↺</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseSectionBlock({
  exercise, exIdx, expanded, onToggleExpand,
  getRepChecked, allRepsForSet, isTimedSetDone, timedSetRunning, timedSetRemaining,
  onToggleRep, onTimedSet, onTriggerRest, showRestTimer, restSeconds, onRestDone,
  activeSetIdx, setActiveSetIdx, isActiveExercise, onActivate,
}: {
  exercise: Exercise;
  exIdx: number;
  expanded: boolean;
  onToggleExpand: () => void;
  getRepChecked: (exId: string, setId: string, i: number) => boolean;
  allRepsForSet: (exId: string, set: Set) => boolean;
  isTimedSetDone: (exId: string, setId: string) => boolean;
  timedSetRunning: boolean;
  timedSetRemaining: number;
  onToggleRep: (setId: string, repIdx: number) => void;
  onTimedSet: (set: Set) => void;
  onTriggerRest: (secs: number) => void;
  showRestTimer: boolean;
  restSeconds: number;
  onRestDone: () => void;
  activeSetIdx: number;
  setActiveSetIdx: (i: number) => void;
  isActiveExercise: boolean;
  onActivate: () => void;
}) {
  const sets = exercise.sets || [];
  const allDone = sets.every(s => allRepsForSet(exercise.id, s));

  return (
    <div className={`card overflow-hidden transition-all ${allDone ? "border-emerald-500/20" : isActiveExercise ? "border-iron-500/30" : ""}`}>
      {/* Exercise header */}
      <button onClick={() => { onActivate(); onToggleExpand(); }} className="w-full px-4 py-4 flex items-start gap-3 text-left">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${allDone ? "bg-emerald-500/20 text-emerald-400" : "bg-iron-500/20 text-blue-400"}`}>
          {allDone ? <CheckCircle2 size={16} /> : exIdx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">{exercise.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-xs text-slate-400">{exercise.musclesPrimary[0]}</span>
            {exercise.sets && (
              <span className="text-xs text-blue-400 font-medium">
                {exercise.sets.length} sets
                {exercise.sets[0].targetReps ? ` × ${exercise.sets[0].targetReps} reps` : ""}
                {exercise.sets[0].targetWeight ? ` @ ${formatWeight(exercise.sets[0].targetWeight)}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {exercise.sets && (
            <div className="text-right">
              <p className="text-xs text-slate-500">{sets.filter(s => allRepsForSet(exercise.id, s)).length}/{sets.length}</p>
            </div>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-slide-up border-t border-white/[0.06] pt-4">
          {/* Exercise info */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
            <p className="text-xs text-slate-300 leading-relaxed">{exercise.description}</p>
            {exercise.sets?.[0]?.tempo && (
              <p className="text-xs text-blue-300 mt-2 font-medium">⏱ Tempo: {exercise.sets[0].tempo} (up–pause–down–pause seconds)</p>
            )}
            <p className="text-xs text-blue-300 mt-1 font-medium">💨 {exercise.breathingCue}</p>
          </div>

          {/* Quick dos/don'ts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs space-y-1">
              {exercise.dos.slice(0, 3).map((d, i) => (
                <p key={i} className="text-emerald-400 flex gap-1"><span>✓</span><span>{d}</span></p>
              ))}
            </div>
            <div className="text-xs space-y-1">
              {exercise.donts.slice(0, 3).map((d, i) => (
                <p key={i} className="text-red-400 flex gap-1"><span>✗</span><span>{d}</span></p>
              ))}
            </div>
          </div>

          {/* Sets */}
          <div className="space-y-3">
            {sets.map((set, si) => {
              const isDone = allRepsForSet(exercise.id, set);
              const isActive = isActiveExercise && si === activeSetIdx;
              return (
                <div
                  key={set.id}
                  className={`set-card p-4 ${isActive ? "active" : ""} ${isDone ? "completed-set" : ""}`}
                  onClick={() => !isDone && setActiveSetIdx(si)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-iron-500/20 text-blue-400"}`}>
                        SET {set.setNumber === 0 ? "W" : set.setNumber}
                        {set.setNumber === 0 ? " (Warm-up)" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {set.targetWeight !== null && (
                        <span className="text-sm font-bold text-white">{formatWeight(set.targetWeight)}</span>
                      )}
                      {set.targetReps && (
                        <span className="text-sm text-slate-300">{set.targetReps} reps</span>
                      )}
                      {set.targetDuration && (
                        <span className="text-sm text-slate-300">{formatDuration(set.targetDuration)}</span>
                      )}
                    </div>
                  </div>

                  {set.notes && (
                    <p className="text-xs text-amber-300/70 mb-3 flex items-center gap-1">
                      <Info size={11} />{set.notes}
                    </p>
                  )}

                  {/* Timed set */}
                  {set.targetDuration ? (
                    <div className="text-center py-2">
                      {isTimedSetDone(exercise.id, set.id) ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                          <CheckCircle2 size={18} />
                          <span className="font-medium">Completed!</span>
                        </div>
                      ) : timedSetRunning && isActive ? (
                        <div>
                          <div className="text-4xl font-mono font-bold text-white animate-timer-tick">
                            {formatTimer(timedSetRemaining)}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Hold position…</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => onTimedSet(set)}
                          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 mx-auto"
                        >
                          <Play size={14} /> Start {formatDuration(set.targetDuration)} Timer
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Rep checkboxes */
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: set.targetReps || 0 }, (_, ri) => {
                        const checked = getRepChecked(exercise.id, set.id, ri);
                        return (
                          <button
                            key={ri}
                            onClick={() => onToggleRep(set.id, ri)}
                            className={`rep-checkbox ${checked ? "checked" : ""}`}
                            title={`Rep ${ri + 1}`}
                          >
                            {checked
                              ? <Check size={18} className="text-white" />
                              : <span className="text-xs text-slate-500 font-medium">{ri + 1}</span>
                            }
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Rest trigger */}
                  {isDone && si < sets.length - 1 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      {isActive && showRestTimer ? (
                        <RestTimer seconds={restSeconds} onDone={onRestDone} autoStart />
                      ) : (
                        <button
                          onClick={() => { setActiveSetIdx(si + 1); onTriggerRest(set.restSeconds); }}
                          className="w-full py-2 text-xs text-slate-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] flex items-center justify-center gap-2"
                        >
                          <Timer size={13} /> Rest {formatDuration(set.restSeconds)} → Next Set
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full exercise card toggle */}
          <details className="group">
            <summary className="text-xs text-slate-500 cursor-pointer flex items-center gap-1 hover:text-slate-300 select-none list-none">
              <Info size={11} /> Full exercise guide
              <ChevronDown size={11} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2">
              <ExerciseCard exercise={exercise} compact />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function EllipticalIntervalRow({ interval, index, done, onToggle }: {
  interval: EllipticalInterval; index: number; done: boolean; onToggle: () => void;
}) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState(interval.durationSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    ref.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(ref.current!);
          setTimerRunning(false);
          onToggle();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  return (
    <div className={`elliptical-interval p-4 ${done ? "completed-interval" : ""}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-orange-400"}`}
        >
          {done && <Check size={14} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${done ? "line-through text-slate-500" : "text-white"}`}>
              {interval.label}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getBgForPace(interval.pace)} ${getColorForPace(interval.pace)}`}>
              {getPaceLabel(interval.pace)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-orange-400 font-medium">Resistance {interval.resistance}</span>
            <span className="text-xs text-slate-400">{formatDuration(interval.durationSeconds)}</span>
            {interval.note && <span className="text-xs text-slate-500 truncate">{interval.note}</span>}
          </div>
        </div>

        {/* Mini timer */}
        {!done && (
          <div className="flex-shrink-0 text-right">
            {timerRunning ? (
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-orange-300 animate-timer-tick">{formatTimer(remaining)}</div>
                <button onClick={() => { setTimerRunning(false); if (ref.current) clearInterval(ref.current); }} className="text-[10px] text-slate-500">pause</button>
              </div>
            ) : (
              <button
                onClick={() => { setRemaining(interval.durationSeconds); setTimerRunning(true); }}
                className="flex items-center gap-1 text-xs text-orange-400 border border-orange-400/30 rounded-lg px-2 py-1 hover:bg-orange-500/10"
              >
                <Play size={11} /> {formatTimer(remaining)}
              </button>
            )}
          </div>
        )}

        {done && <SkipForward size={16} className="text-emerald-400 flex-shrink-0" />}
      </div>
    </div>
  );
}

function Activity({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
