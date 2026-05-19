"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useStore } from "@/lib/store";

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, authReady } = useStore();
  const hydratedFor = useRef<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (hydratedFor.current !== user.uid) {
          hydratedFor.current = user.uid;
          try {
            await hydrate(user.uid);
          } catch (e) {
            console.error("Firestore hydration failed:", e);
            // Still mark auth ready so the app is usable
            useStore.setState({ authReady: true, uid: user.uid });
          }
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e: unknown) {
          const code = (e as { code?: string }).code;
          if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
            setAuthError("enable-anon-auth");
          } else {
            console.error("Auth error:", e);
          }
          // Mark ready so the UI loads even without cloud sync
          useStore.setState({ authReady: true });
        }
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
            <li><span className="text-blue-400 font-medium">5.</span> Also enable <strong className="text-white">Firestore Database</strong> in your project (start in test mode)</li>
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
