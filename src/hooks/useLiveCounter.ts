"use client";

import { useState, useEffect } from "react";

interface CounterState {
  online: number;
  activeChats: number;
  countries: number;
}

export function useLiveCounter(initialOnline: number = 4850) {
  const [stats, setStats] = useState<CounterState>({
    online: initialOnline,
    activeChats: Math.floor(initialOnline / 2.3),
    countries: 180,
  });

  useEffect(() => {
    // Gentle natural online user fluctuation every 4-6 seconds
    const interval = setInterval(() => {
      setStats((prev) => {
        const delta = Math.floor(Math.random() * 21) - 10; // -10 to +10
        const newOnline = Math.max(1200, prev.online + delta);
        return {
          online: newOnline,
          activeChats: Math.floor(newOnline / 2.3),
          countries: 180,
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
