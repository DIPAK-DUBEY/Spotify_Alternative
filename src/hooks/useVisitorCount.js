import { useEffect, useState } from "react";

const FLAG_KEY = "purane-geet:visited";

export default function useVisitorCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const alreadyVisited = localStorage.getItem(FLAG_KEY) === "1";

    const request = alreadyVisited
      ? fetch("/api/visits", { method: "GET" })
      : fetch("/api/visits", { method: "POST" });

    request
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          if (!alreadyVisited) {
            try {
              localStorage.setItem(FLAG_KEY, "1");
            } catch {
              /* storage unavailable — ignore */
            }
          }
          setCount(data.count);
        }
      })
      .catch(() => {
        /* API unavailable — counter stays hidden */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
