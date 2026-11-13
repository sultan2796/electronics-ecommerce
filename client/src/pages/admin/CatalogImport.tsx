import { useState } from "react";
import Alert from "../../components/common/Alert";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { ImportResult } from "../../types";

export default function CatalogImport({ onImported }: { onImported: () => void }) {
  const [replaceDemo, setReplaceDemo] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      setResult(await adminService.importCatalog(replaceDemo));
      onImported();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Real məhsul məlumatları</h2>
        <p className="text-sm text-muted">
          Smartfon, noutbuk, planşet və mobil aksesuarları foto, qiymət, reytinq və stokla birlikdə DummyJSON API-dən bazaya yükləyir. Qiymətlər USD-dən AZN-ə (1 USD = 1.70 AZN) çevrilir. Təkrar işlətmək olar: mövcud məhsullar yenilənir.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={replaceDemo} onChange={(e) => setReplaceDemo(e.target.checked)} />
        Test (demo) məhsulları satışdan çıxar
      </label>
      <button type="button" className="btn-primary" disabled={running} onClick={run}>
        {running ? "Yüklənir..." : "API-dən məhsulları yüklə"}
      </button>
      {error && <Alert>{error}</Alert>}
      {result && (
        <Alert variant="success">
          {`${result.created} yeni məhsul əlavə edildi, ${result.updated} yeniləndi`}
          {result.deactivated > 0 && `, ${result.deactivated} test məhsulu satışdan çıxarıldı`}.
        </Alert>
      )}
    </section>
  );
}
