"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatTimer } from "@/lib/utils";

interface Props {
  seconds: number;
  onDone?: () => void;
  autoStart?: boolean;
}

export default function RestTimer({ seconds, onDone, autoStart }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart ?? false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(autoStart ?? false);
    setDone(false);
  }, [seconds, autoStart]);

  useEffect(() => {
    if (!running) { stop(); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          stop();
          setRunning(false);
          setDone(true);
          onDone?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return stop;
  }, [running, stop, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={done ? "#22c55e" : remaining <= 10 ? "#ef4444" : "#4a5cf7"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xl font-mono font-bold ${done ? "text-green-400" : remaining <= 10 ? "text-red-400" : "text-white"} ${running && !done ? "animate-timer-tick" : ""}`}>
          {done ? "✓" : formatTimer(remaining)}
        </span>
      </div>

      <div className="flex gap-2">
        {!done && (
          <button
            onClick={() => setRunning(r => !r)}
            className="px-4 py-1.5 text-sm rounded-lg font-medium"
            style={{ background: running ? "rgba(239,68,68,0.15)" : "rgba(74,92,247,0.2)", color: running ? "#f87171" : "#818cf8", border: `1px solid ${running ? "rgba(239,68,68,0.3)" : "rgba(74,92,247,0.35)"}` }}
          >
            {running ? "Pause" : remaining === seconds ? "Start" : "Resume"}
          </button>
        )}
        <button
          onClick={() => { stop(); setRemaining(seconds); setRunning(false); setDone(false); }}
          className="px-4 py-1.5 text-sm rounded-lg font-medium"
          style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Reset
        </button>
      </div>

      {done && (
        <p className="text-sm text-green-400 font-medium animate-bounce-in">Rest complete — next set!</p>
      )}
    </div>
  );
}
