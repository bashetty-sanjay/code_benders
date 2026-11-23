"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: "instant" });
    // Focus the main container for accessibility
    ref.current?.focus();
  }, [pathname]);

  return (
    <div ref={ref} className="page-enter" tabIndex={-1} style={{ outline: "none" }}>
      {children}
    </div>
  );
}
