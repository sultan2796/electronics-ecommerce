import { useState } from "react";
import Alert from "../common/Alert";
import { buttonClass } from "../ui/Button";
import { adminService } from "../../services/admin.service";
import { getErrorMessage } from "../../services/api";

const formatBytes = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

export default function ImageOptimizer() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ converted: number; savedBytes: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    const total = { converted: 0, savedBytes: 0, skipped: 0 };
    setResult({ ...total });
    try {
      let cursor: string | undefined;
      for (let round = 0; round < 500; round += 1) {
        const batch = await adminService.optimizeImages(cursor);
        total.converted += batch.converted;
        total.savedBytes += batch.savedBytes;
        total.skipped += batch.skipped;
        setResult({ ...total });
        if (!batch.nextCursor) break;
        cursor = batch.nextCursor;
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="card space-y-3 p-5">
      <div>
        <h2 className="font-semibold">Şəkilləri optimallaşdır</h2>
        <p className="text-sm text-muted">
          Yeni yüklənən şəkillər avtomatik WebP-yə çevrilir. Bu düymə əvvəl yüklənmiş PNG və JPG şəkilləri də çevirir və kiçildir. Linklər dəyişmir.
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      {result && (
        <p className="text-sm" role="status">
          {`${result.converted} şəkil çevrildi · ${formatBytes(result.savedBytes)} qənaət${result.skipped ? ` · ${result.skipped} şəkil olduğu kimi saxlanıldı` : ""}${running ? " · davam edir..." : ""}`}
        </p>
      )}
      <button type="button" className={buttonClass("secondary")} disabled={running} onClick={() => void run()}>
        {running ? "Çevrilir..." : "Köhnə şəkilləri WebP-yə çevir"}
      </button>
    </section>
  );
}
