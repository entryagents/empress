"use client";

import { MotionConfig } from "motion/react";

/** Global client providers. Phase 2 adds cart / auth providers here. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
