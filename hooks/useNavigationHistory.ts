// hooks/useNavigationHistory.ts
import { usePathname, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";

export function useNavigationHistory() {
  const segments = useSegments();
  console.log("Current segments:", segments);
  const pathName = usePathname();
  console.log("Current pathname:", pathName);
  const logrouter = useRouter();
  console.log("Router object:", logrouter);
  const [history, setHistory] = useState<string[]>([]);
  const prevSegments = useRef<string[]>([]);

  useEffect(() => {
    const currentPath = "/" + segments.join("/");

    if (segments.length > prevSegments.current.length) {
      // Push
      setHistory((prev) => [...prev, currentPath]);
      console.log("➡️ PUSH to", currentPath);
    } else if (segments.length < prevSegments.current.length) {
      // Back
      setHistory((prev) => prev.slice(0, -1));
      console.log("⬅️ BACK to", currentPath);
    } else {
      // Replace or refresh
      setHistory((prev) => [...prev.slice(0, -1), currentPath]);
      console.log("🔄 REPLACE/REFRESH to", currentPath);
    }

    prevSegments.current = segments;
  }, [segments]);

  return history;
}
