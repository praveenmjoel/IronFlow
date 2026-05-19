import { create } from "zustand";
import type { WorkoutSession, BodyMeasurement, LoggedSet } from "./types";
import { WORKOUT_PROGRAM } from "./workoutData";
import {
  saveProfile, saveSession, saveMeasurement,
  loadProfile, loadSessions, loadMeasurements,
  type ProfileData,
} from "./firestoreService";

interface AppState {
  /* ─── Auth ─── */
  uid: string | null;
  authReady: boolean;

  /* ─── Workout sessions ─── */
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;

  /* ─── User profile ─── */
  userName: string;
  userPhoto: string | null;
  onboardingDone: boolean;

  /* ─── Measurements ─── */
  measurements: BodyMeasurement[];

  /* ─── Stats ─── */
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalXP: number;

  /* ─── Actions ─── */
  setUid: (uid: string) => void;
  hydrate: (uid: string, googleName?: string, googlePhoto?: string) => Promise<void>;

  startWorkout: (dayNumber: number, date?: string) => void;
  updateWarmupCheck: (stepId: string, done: boolean) => void;
  updateCooldownCheck: (stepId: string, done: boolean) => void;
  toggleRepCheck: (exerciseId: string, setId: string, repIndex: number) => void;
  toggleIntervalComplete: (intervalId: string) => void;
  completeWorkout: (notes?: string, rpe?: number) => void;
  abandonWorkout: () => void;

  addMeasurement: (m: Omit<BodyMeasurement, "id">) => void;
  completeOnboarding: (name: string) => void;

  getCompletionPercent: () => number;
}

/* ─── helpers ─── */

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function calcCompletion(session: WorkoutSession, dayNumber: number): number {
  const day = WORKOUT_PROGRAM.find(d => d.dayNumber === dayNumber);
  if (!day) return 0;
  let total = 0, done = 0;

  total += day.warmup.length;
  done  += Object.values(session.warmupChecked).filter(Boolean).length;

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
        done  += (log?.repsCompleted || []).filter(Boolean).length;
      }
    });
  });

  if (day.elliptical) {
    total += day.elliptical.intervals.length;
    done  += session.loggedIntervals.filter(i => i.completed).length;
  }

  total += day.cooldown.length;
  done  += Object.values(session.cooldownChecked).filter(Boolean).length;

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/* Persist profile to Firestore in background — never blocks UI */
function syncProfile(uid: string | null, state: AppState) {
  if (!uid) return;
  const data: ProfileData = {
    userName: state.userName,
    onboardingDone: state.onboardingDone,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    totalWorkouts: state.totalWorkouts,
    totalXP: state.totalXP,
  };
  saveProfile(uid, data).catch(console.error);
}

function syncSession(uid: string | null, session: WorkoutSession) {
  if (!uid) return;
  saveSession(uid, session).catch(console.error);
}

export const useStore = create<AppState>()((set, get) => ({
  uid: null,
  authReady: false,
  sessions: [],
  activeSession: null,
  userName: "",
  userPhoto: null,
  onboardingDone: false,
  measurements: [],
  currentStreak: 0,
  longestStreak: 0,
  totalWorkouts: 0,
  totalXP: 0,

  /* ─── Auth & hydration ─── */

  setUid: (uid) => set({ uid, authReady: true }),

  hydrate: async (uid, googleName, googlePhoto) => {
    const [profile, sessions, measurements] = await Promise.all([
      loadProfile(uid),
      loadSessions(uid),
      loadMeasurements(uid),
    ]);

    const userName = profile?.userName || googleName || "";
    const onboardingDone = profile?.onboardingDone ?? (!!googleName);

    set({
      sessions,
      measurements,
      userName,
      userPhoto:      googlePhoto ?? null,
      onboardingDone,
      currentStreak:  profile?.currentStreak  ?? 0,
      longestStreak:  profile?.longestStreak  ?? 0,
      totalWorkouts:  profile?.totalWorkouts  ?? 0,
      totalXP:        profile?.totalXP        ?? 0,
      authReady: true,
      uid,
    });

    // If this is a first Google sign-in with no saved profile, persist it now
    if (!profile && googleName) {
      saveProfile(uid, {
        userName, onboardingDone: true,
        currentStreak: 0, longestStreak: 0, totalWorkouts: 0, totalXP: 0,
      }).catch(console.error);
    }
  },

  /* ─── Workout lifecycle ─── */

  startWorkout: (dayNumber, date) => {
    const d = date || todayISO();
    const existing = get().sessions.find(s => s.date === d && s.dayNumber === dayNumber);
    if (existing) { set({ activeSession: existing }); return; }

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
    syncSession(get().uid, session);
  },

  updateWarmupCheck: (stepId, done) => {
    set(s => {
      if (!s.activeSession) return s;
      const sess = { ...s.activeSession, warmupChecked: { ...s.activeSession.warmupChecked, [stepId]: done } };
      sess.completionPercent = calcCompletion(sess, sess.dayNumber);
      syncSession(s.uid, sess);
      return { activeSession: sess };
    });
  },

  updateCooldownCheck: (stepId, done) => {
    set(s => {
      if (!s.activeSession) return s;
      const sess = { ...s.activeSession, cooldownChecked: { ...s.activeSession.cooldownChecked, [stepId]: done } };
      sess.completionPercent = calcCompletion(sess, sess.dayNumber);
      syncSession(s.uid, sess);
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
      syncSession(s.uid, sess);
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
      syncSession(s.uid, sess);
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
      const newStreak = s.currentStreak + 1;
      const xp = Math.round(completed.completionPercent * 2.5);
      const next = {
        sessions,
        activeSession: null as WorkoutSession | null,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, s.longestStreak),
        totalWorkouts: s.totalWorkouts + 1,
        totalXP: s.totalXP + xp,
      };
      syncSession(s.uid, completed);
      syncProfile(s.uid, { ...s, ...next });
      return next;
    });
  },

  abandonWorkout: () => {
    set(s => {
      if (!s.activeSession) return s;
      const sessions = [...s.sessions.filter(x => x.id !== s.activeSession!.id), s.activeSession!];
      syncSession(s.uid, s.activeSession!);
      return { activeSession: null, sessions };
    });
  },

  /* ─── Measurements ─── */

  addMeasurement: (m) => {
    const measurement: BodyMeasurement = { ...m, id: `meas-${Date.now()}` };
    set(s => ({ measurements: [...s.measurements, measurement] }));
    saveMeasurement(get().uid!, measurement).catch(console.error);
  },

  /* ─── Onboarding ─── */

  completeOnboarding: (name) => {
    set({ userName: name, onboardingDone: true });
    const s = get();
    syncProfile(s.uid, { ...s, userName: name, onboardingDone: true });
  },

  getCompletionPercent: () => get().activeSession?.completionPercent ?? 0,
}));
