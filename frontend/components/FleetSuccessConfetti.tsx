"use client";
import { useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";

export function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b"];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function FleetSuccessConfetti({ state }: { state: any }) {
  const prevAtRisk = useRef<number>(0);
  const hasFired = useRef(false);

  useEffect(() => {
    if (!state?.ships) return;
    const atRisk = state.ships.filter((s: any) => s.status === "at-risk" || s.status === "delayed").length;

    // Fire confetti when all at-risk vessels are resolved (transition to 0)
    if (prevAtRisk.current > 0 && atRisk === 0 && !hasFired.current) {
      hasFired.current = true;
      setTimeout(() => fireConfetti(), 300);
      setTimeout(() => { hasFired.current = false; }, 5000);
    }
    prevAtRisk.current = atRisk;
  }, [state]);

  return null; // No visual — just effects
}
