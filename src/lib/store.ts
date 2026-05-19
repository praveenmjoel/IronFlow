import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WorkoutSession, BodyMeasurement, PersonalRecord,
  ProgressionRecommendation, LoggedSet, LoggedEllipticalInterval,
} from "./types";
import { WORKOUT_PROGRAM } from "./workoutData";

interface AppState {
  /* ─── Workout sessions ─── */
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;

  /* ─── User profile ─── */
  userName: string;
  onboardingDone: boolean;
  weekStartDay: number;           // 0=Sun, 1=Mon

  /* ─── Measurements ─── */
  measurements: BodyMeasurement[];

  /* ─── Records & progression ─── */
  personalRecords: PersonalRecord[];
  progressionHistory: ProgressionRecommendation[];

  /* ─── Streaks ─── */
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalXP: number;

  /* ─── Actions ─── */
  startWorkout: (dayNumber: number, date?: string) => void;
  updateWarmupCheck: (stepId: string, done: boolean) => void;
  updateCooldownCheck: (stepId: string, done: boolean) => void;
  updateSetLog: (exerciseId: string, setIndex: number, log: Partial<LoggedSet>) => void;
  toggleRepCheck: (exerciseId: string, setId: string, repIndex: number) => void;
  toggleIntervalComplete: (intervalId: string) => void;
  completeWorkout: (notes?: string, rpe?: number) => void;
  abandonWorkout: () => void;

  /* ─── Measurement actions ─── */
  addMeasurement: (m: Omit<BodyMeasurement, "id">) => void;

  /* ─── Onboarding ─── */
  completeOnboarding: (name: string) => void;

  /* ─── Helpers ─── */
  getSessionForDate: (date: string) => WorkoutSession | undefined;
  getCompletionPercent: () => number;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function calcCompletion(session: WorkoutSession, dayNumber: number): number {
  const day = WORKOUT_PROGRAM.find(d => d.dayNumber === dayNumber);
  if (!day) return 0;

  let total = 0;
  let done = 0;

  // Warmup steps
  total += day.warmup.length;
  done += Object.values(session.warmupChecked).filter(Boolean).length;

  // Exercise sets & reps
  day.exercises.forEach(ex => {
    (ex.sets || []).forEach(set => {
      if (set.targetDuration) {
        total += 1;
        const log = session.loggedSets[`${ex.id}-${set.id}`];
        if (log?.repsCompleted?.[0]) done += 1;
      } else {
        const reps = set.targetReps || 0;
        total += reps;
        const log = session.loggedSets[`${ex.id}-${set.id}`];
        done += (log?.repsCompleted || []).filter(Boolean).length;
      }
    });
  });

  // Elliptical intervals
  if (day.elliptical) {
    total += day.elliptical.intervals.length;
    done += session.loggedIntervals.filter(i => i.completed).length;
  }

  // Cooldown
  total += day.cooldown.length;
  done += Object.values(session.cooldownChecked).filter(Boolean).length;

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      userName: "",
      onboardingDone: false,
      weekStartDay: 1,
      measurements: [],
      personalRecords: [],
      progressionHistory: [],
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      totalXP: 0,

      startWorkout: (dayNumber, date) => {
        const d = date || todayISO();
        const existing = get().sessions.find(s => s.date === d && s.dayNumber === dayNumber);
        if (existing) {
          set({ activeSession: existing });
          return;
        }
        const session: WorkoutSession = {
          id: `${d}-${dayNumber}-${Date.now()}`,
          dayNumber,
          date: d,
          startedAt: new Date().toISOString(),
          loggedSets: {},
          loggedIntervals: [],
          warmupChecked: {},
          cooldownChecked: {},
          completionPercent: 0,
        };
        set({ activeSession: session });
      },

      updateWarmupCheck: (stepId, done) => {
        set(s => {
          if (!s.activeSession) return s;
          const sess = { ...s.activeSession, warmupChecked: { ...s.activeSession.warmupChecked, [stepId]: done } };
          sess.completionPercent = calcCompletion(sess, sess.dayNumber);
          return { activeSession: sess };
        });
      },

      updateCooldownCheck: (stepId, done) => {
        set(s => {
          if (!s.activeSession) return s;
          const sess = { ...s.activeSession, cooldownChecked: { ...s.activeSession.cooldownChecked, [stepId]: done } };
          sess.completionPercent = calcCompletion(sess, sess.dayNumber);
          return { activeSession: sess };
        });
      },

      updateSetLog: (exerciseId, setIndex, log) => {
        set(s => {
          if (!s.activeSession) return s;
          const key = `${exerciseId}-set${setIndex}`;
          const existing = s.activeSession.loggedSets[key] || {
            setId: key, repsCompleted: [], weightUsed: 0, completedAt: new Date().toISOString()
          };
          const updated = { ...existing, ...log };
          const sess = { ...s.activeSession, loggedSets: { ...s.activeSession.loggedSets, [key]: updated } };
          sess.completionPercent = calcCompletion(sess, sess.dayNumber);
          return { activeSession: sess };
        });
      },

      toggleRepCheck: (exerciseId, setId, repIndex) => {
        set(s => {
          if (!s.activeSession) return s;
          const key = `${exerciseId}-${setId}`;
          const existing = s.activeSession.loggedSets[key];
          const repsCompleted = existing?.repsCompleted ? [...existing.repsCompleted] : [];
          repsCompleted[repIndex] = repsCompleted[repIndex] ? 0 : 1;
          const updated: LoggedSet = {
            setId,
            repsCompleted,
            weightUsed: existing?.weightUsed || 0,
            completedAt: new Date().toISOString(),
          };
          const sess = { ...s.activeSession, loggedSets: { ...s.activeSession.loggedSets, [key]: updated } };
          sess.completionPercent = calcCompletion(sess, sess.dayNumber);
          return { activeSession: sess };
        });
      },

      toggleIntervalComplete: (intervalId) => {
        set(s => {
          if (!s.activeSession) return s;
          const intervals = [...s.activeSession.loggedIntervals];
          const idx = intervals.findIndex(i => i.intervalId === intervalId);
          if (idx === -1) {
            intervals.push({ intervalId, completed: true, completedAt: new Date().toISOString() });
          } else {
            intervals[idx] = { ...intervals[idx], completed: !intervals[idx].completed };
          }
          const sess = { ...s.activeSession, loggedIntervals: intervals };
          sess.completionPercent = calcCompletion(sess, sess.dayNumber);
          return { activeSession: sess };
        });
      },

      completeWorkout: (notes, rpe) => {
        set(s => {
          if (!s.activeSession) return s;
          const completed: WorkoutSession = {
            ...s.activeSession,
            completedAt: new Date().toISOString(),
            notes,
            overallRpe: rpe,
            completionPercent: calcCompletion(s.activeSession, s.activeSession.dayNumber),
          };

          const sessions = [...s.sessions.filter(x => x.id !== completed.id), completed];

          // Update streak
          const newStreak = s.currentStreak + 1;
          const xp = Math.round(completed.completionPercent * 2.5);

          return {
            sessions,
            activeSession: null,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, s.longestStreak),
            totalWorkouts: s.totalWorkouts + 1,
            totalXP: s.totalXP + xp,
          };
        });
      },

      abandonWorkout: () => {
        set(s => {
          if (!s.activeSession) return s;
          const sessions = [...s.sessions.filter(x => x.id !== s.activeSession!.id), s.activeSession!];
          return { activeSession: null, sessions };
        });
      },

      addMeasurement: (m) => {
        const measurement: BodyMeasurement = { ...m, id: `meas-${Date.now()}` };
        set(s => ({ measurements: [...s.measurements, measurement] }));
      },

      completeOnboarding: (name) => {
        set({ userName: name, onboardingDone: true });
      },

      getSessionForDate: (date) => {
        return get().sessions.find(s => s.date === date);
      },

      getCompletionPercent: () => {
        const { activeSession } = get();
        return activeSession?.completionPercent || 0;
      },
    }),
    {
      name: "ironflow-storage",
      version: 1,
    }
  )
);
