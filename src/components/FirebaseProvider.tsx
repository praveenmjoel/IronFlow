"use client";
import { useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { Dumbbell } from "lucide-react";

const provider = new GoogleAuthProvider();

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, authReady } = useStore();
  const hydratedFor = useRef<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      if (currentUser?.isAnonymous) {
        await linkWithPopup(currentUser, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        console.error("Google sign-in error:", e);
      }
      setSigningIn(false);
    }
  };

  const handleAnonymous = async () => {
    setSigningIn(true);
    try {
      await signInAnonymously(auth);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
        setAuthError("enable-anon-auth");
      } else {
        console.error("Auth error:", e);
      }
      setSigningIn(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setShowSignIn(false);
        setSigningIn(false);
        if (hydratedFor.current !== user.uid) {
          hydratedFor.current = user.uid;
          try {
            await hydrate(
              user.uid,
              user.displayName ?? undefined,
              user.photoURL ?? undefined,
              user.email ?? undefined,
            );
          } catch (e) {
            console.error("Firestore hydration failed:", e);
            useStore.setState({ authReady: true, uid: user.uid });
          }
        }
      } else {
        setCurrentUser(null);
        setShowSignIn(true);
        useStore.setState({ authReady: false });
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authError === "enable-anon-auth") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">🔧</div>
          <h2 className="text-lg font-bold text-white">One quick Firebase setup needed</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Enable <strong className="text-white">Anonymous Authentication</strong> in your Firebase console:
          </p>
          <ol className="text-sm text-slate-400 text-left space-y-2 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <li><span className="text-blue-400 font-medium">1.</span> Go to <strong className="text-white">Firebase Console</strong></li>
            <li><span className="text-blue-400 font-medium">2.</span> Select your <strong className="text-white">IronFlow</strong> project</li>
            <li><span className="text-blue-400 font-medium">3.</span> Click <strong className="text-white">Authentication</strong> → <strong className="text-white">Sign-in method</strong></li>
            <li><span className="text-blue-400 font-medium">4.</span> Enable <strong className="text-white">Anonymous</strong></li>
          </ol>
          <button
            onClick={() => { setAuthError(null); window.location.reload(); }}
            className="btn-primary w-full py-3 text-sm"
          >
            Done — Reload App
          </button>
        </div>
      </div>
    );
  }

  if (showSignIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <div className="card p-8 w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto">
            <Dumbbell size={32} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">IronFlow</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your personal workout OS. Sign in to sync your training data across all devices.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {signingIn ? "Signing in…" : "Continue with Google"}
            </button>

            <button
              onClick={handleAnonymous}
              disabled={signingIn}
              className="w-full py-2.5 px-4 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-60"
            >
              Continue without an account
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Google sign-in syncs your workouts, measurements, and progress across every device.
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center animate-pulse-slow">
            <span className="text-white text-xl">⚡</span>
          </div>
          <p className="text-slate-400 text-sm">Loading IronFlow…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
