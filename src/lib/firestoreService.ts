import {
  doc, getDoc, setDoc, collection,
  getDocs, deleteDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { WorkoutSession, BodyMeasurement } from "./types";

/* ─── Path helpers ─── */
const profileRef  = (uid: string) => doc(db, "users", uid, "data", "profile");
const sessionsCol = (uid: string) => collection(db, "users", uid, "sessions");
const sessionRef  = (uid: string, id: string) => doc(db, "users", uid, "sessions", id);
const measCol     = (uid: string) => collection(db, "users", uid, "measurements");
const measRef     = (uid: string, id: string) => doc(db, "users", uid, "measurements", id);

/* ─── Profile ─── */

export interface ProfileData {
  userName: string;
  onboardingDone: boolean;
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalXP: number;
}

export async function loadProfile(uid: string): Promise<ProfileData | null> {
  const snap = await getDoc(profileRef(uid));
  return snap.exists() ? (snap.data() as ProfileData) : null;
}

export async function saveProfile(uid: string, data: ProfileData): Promise<void> {
  await setDoc(profileRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/* ─── Sessions ─── */

export async function loadSessions(uid: string): Promise<WorkoutSession[]> {
  const snap = await getDocs(sessionsCol(uid));
  return snap.docs.map(d => d.data() as WorkoutSession);
}

export async function saveSession(uid: string, session: WorkoutSession): Promise<void> {
  await setDoc(sessionRef(uid, session.id), session);
}

export async function saveSessionsBatch(uid: string, sessions: WorkoutSession[]): Promise<void> {
  const batch = writeBatch(db);
  sessions.forEach(s => batch.set(sessionRef(uid, s.id), s));
  await batch.commit();
}

/* ─── Measurements ─── */

export async function loadMeasurements(uid: string): Promise<BodyMeasurement[]> {
  const snap = await getDocs(measCol(uid));
  return snap.docs.map(d => d.data() as BodyMeasurement);
}

export async function saveMeasurement(uid: string, m: BodyMeasurement): Promise<void> {
  await setDoc(measRef(uid, m.id), m);
}
