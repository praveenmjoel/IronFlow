export type ExerciseCategory =
  | "biceps" | "triceps" | "shoulders" | "chest" | "back"
  | "core" | "legs" | "cardio" | "mobility" | "warmup";

export type Equipment = "dumbbell" | "barbell" | "kettlebell" | "pushup_bracket" | "elliptical" | "bodyweight" | "none";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type WorkoutPhase = "warmup" | "activation" | "main" | "cardio" | "cooldown" | "core";

export interface Set {
  id: string;
  setNumber: number;
  targetWeight: number | null;   // kg per dumbbell, or total barbell weight
  targetReps: number | null;
  targetDuration?: number;       // seconds, for timed sets
  restSeconds: number;
  tempo?: string;                // e.g. "2-0-3-0" (up-pause-down-pause)
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: Equipment;
  difficulty: Difficulty;
  musclesPrimary: string[];
  musclesSecondary: string[];
  description: string;
  dos: string[];
  donts: string[];
  breathingCue: string;
  safetyNotes?: string;
  sets?: Set[];
  phase: WorkoutPhase;
  order: number;
}

export interface EllipticalInterval {
  id: string;
  label: string;
  resistance: number;
  durationSeconds: number;
  pace: "easy" | "moderate" | "fast" | "sprint" | "recovery" | "cooldown";
  note?: string;
}

export interface EllipticalSession {
  id: string;
  name: string;
  totalMinutes: number;
  intervals: EllipticalInterval[];
  estimatedCalories: number;
}

export interface WarmupStep {
  id: string;
  activity: string;
  reps?: number;
  durationSeconds?: number;
  note?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  focus: string;
  durationMinutes: number;
  warmup: WarmupStep[];
  exercises: Exercise[];
  elliptical?: EllipticalSession;
  cooldown: WarmupStep[];
  muscleGroups: string[];
  intensity: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

/* ─── Tracked data ─── */

export interface LoggedSet {
  setId: string;
  repsCompleted: number[];    // array of booleans as 0/1 per rep
  weightUsed: number;
  durationSeconds?: number;
  completedAt: string;        // ISO
  rpe?: number;               // 1-10
}

export interface LoggedEllipticalInterval {
  intervalId: string;
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutSession {
  id: string;
  dayNumber: number;
  date: string;               // ISO date YYYY-MM-DD
  startedAt: string;
  completedAt?: string;
  loggedSets: Record<string, LoggedSet>;     // exerciseId → LoggedSet[]
  loggedIntervals: LoggedEllipticalInterval[];
  warmupChecked: Record<string, boolean>;    // stepId → done
  cooldownChecked: Record<string, boolean>;
  notes?: string;
  overallRpe?: number;
  mood?: 1 | 2 | 3 | 4 | 5;
  completionPercent: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number;
  leftBicep?: number;
  rightBicep?: number;
  waist?: number;
  chest?: number;
  hips?: number;
  restingHR?: number;
  notes?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  volumeLoad: number;
}

export interface ProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
  date: string;
}

export type CheckedReps = Record<string, boolean[]>; // setId → per-rep booleans
