import { useEffect, useState } from "react";
import { api, apiIsConfigured, getErrorMessage } from "../../services/api";

type Status = "checking" | "online" | "offline";

export default function ApiStatusBanner() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("checking");
    api
      .get("/health", { timeout: 60000 })
      .then(() => active && setStatus("online"))
      .catch((error) => {
        if (!active) return;
        setStatus("offline");
        setMessage(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (status === "online") return null;

  if (status === "checking") {
    if (!apiIsConfigured) return null;
    return (
      <div className="bg-chip px-4 py-2 text-center text-xs text-muted" role="status">
        Serverə qoşulur... (pulsuz hostinqdə ilk açılış 30-50 saniyə çəkə bilər)
      </div>
    );
  }

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" role="alert">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p>
          <strong className="font-semibold">Server əlçatmazdır.</strong> {message}
        </p>
        <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => setAttempt((value) => value + 1)}>
          Yenidən yoxla
        </button>
      </div>
    </div>
  );
}
