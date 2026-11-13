import { Suspense, lazy, useState } from "react";
import { confirmDialog } from "../common/Overlays";
import { getErrorMessage } from "../../services/api";
import { extraService } from "../../services/extra.service";

const ModelStage = lazy(() => import("../product/ModelStage"));

export interface ModelFields {
  model3dUrl: string;
  model3dActive: boolean;
  model3dSize: number | null;
  model3dLicense: string;
  model3dSource: string;
}

type Status = "idle" | "loading" | "ok" | "error";

const MAX_BYTES = 10 * 1024 * 1024;

export const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function ModelManager({ value, onChange, alt }: { value: ModelFields; onChange: (next: Partial<ModelFields>) => void; alt: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [previewKey, setPreviewKey] = useState(0);
  const [preview, setPreview] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!/\.glb$/i.test(file.name)) {
      setError("Yalnız .glb faylı yükləmək olar. GLTF faylları üçün link sahəsindən istifadə edin.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("3D model 10 MB-dan böyük olmamalıdır");
      return;
    }
    setUploading(true);
    try {
      const result = await extraService.uploadModel(file);
      onChange({ model3dUrl: result.url, model3dSize: result.size, model3dActive: true });
      setStatus("loading");
      setProgress(0);
      setPreview(true);
      setPreviewKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const check = () => {
    setStatus("loading");
    setProgress(0);
    setPreview(true);
    setPreviewKey((key) => key + 1);
  };

  const remove = async () => {
    if (!(await confirmDialog("3D model məhsuldan silinsin?", { description: "Məhsul səhifəsində yalnız şəkillər göstəriləcək.", confirmLabel: "Sil" }))) return;
    onChange({ model3dUrl: "", model3dSize: null, model3dLicense: "", model3dSource: "", model3dActive: true });
    setPreview(false);
    setStatus("idle");
  };

  const hasModel = Boolean(value.model3dUrl.trim());

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">3D model</h2>
        {hasModel && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              value.model3dActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-chip text-muted"
            }`}
          >
            {value.model3dActive ? "Aktiv" : "Deaktiv"}
          </span>
        )}
      </div>

      {hasModel && preview ? (
        <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#f6f7f9] dark:bg-white">
          <Suspense fallback={null}>
            <ModelStage
              key={previewKey}
              src={value.model3dUrl}
              alt={alt}
              onProgress={setProgress}
              onLoaded={() => setStatus("ok")}
              onError={() => setStatus("error")}
            />
          </Suspense>
          {status !== "ok" && status !== "error" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2" role="status">
              <span className="size-7 animate-spin rounded-full border-2 border-line border-t-brand-600" />
              <span className="text-xs text-muted">{progress ? `${progress}%` : "Yüklənir..."}</span>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-600">Model açılmadı. Linki və ya faylı yoxlayın.</div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-line bg-chip/40 p-6 text-center text-sm text-muted">
          {hasModel ? (
            <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={check}>
              Önizləməni aç
            </button>
          ) : (
            <p>Bu məhsulun 3D modeli yoxdur. Məhsul səhifəsində şəkillər göstərilir.</p>
          )}
        </div>
      )}

      {hasModel && (
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-chip/60 p-2.5">
            <dt className="text-muted">Fayl ölçüsü</dt>
            <dd className="font-semibold">{formatBytes(value.model3dSize)}</dd>
          </div>
          <div className="rounded-xl bg-chip/60 p-2.5">
            <dt className="text-muted">Yüklənmə vəziyyəti</dt>
            <dd className={`font-semibold ${status === "ok" ? "text-emerald-600" : status === "error" ? "text-red-600" : ""}`}>
              {status === "ok" ? "Uğurlu" : status === "error" ? "Xəta" : status === "loading" ? "Yoxlanılır..." : "Yoxlanılmayıb"}
            </dd>
          </div>
        </dl>
      )}

      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input type="file" accept=".glb,model/gltf-binary" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
        {uploading ? "Yüklənir..." : hasModel ? "Modeli dəyiş (.glb, maks. 10 MB)" : "GLB modeli yüklə (maks. 10 MB)"}
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <label className="block space-y-1">
        <span className="text-sm font-medium">və ya model linki (GLB / GLTF)</span>
        <input
          className="input font-mono text-xs"
          type="url"
          placeholder="https://.../model.glb"
          value={value.model3dUrl}
          onChange={(event) => {
            setPreview(false);
            setStatus("idle");
            onChange({ model3dUrl: event.target.value, model3dSize: null });
          }}
        />
      </label>

      {hasModel && (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Lisenziya</span>
            <input className="input" maxLength={200} placeholder="CC0, CC BY 4.0, öz modelimiz..." value={value.model3dLicense} onChange={(event) => onChange({ model3dLicense: event.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Müəllif və mənbə</span>
            <input className="input" maxLength={300} placeholder="Müəllif adı · https://..." value={value.model3dSource} onChange={(event) => onChange({ model3dSource: event.target.value })} />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={value.model3dActive} onChange={(event) => onChange({ model3dActive: event.target.checked })} />
              Məhsul səhifəsində göstər
            </label>
            <div className="flex gap-2">
              <button type="button" className="btn-outline px-3 py-2 text-xs" onClick={check}>
                Yüklənməni yoxla
              </button>
              <button type="button" className="btn-outline px-3 py-2 text-xs text-red-600" onClick={() => void remove()}>
                Modeli sil
              </button>
            </div>
          </div>
        </>
      )}
      <p className="text-[11px] leading-snug text-muted">Yalnız məhsulun özünə aid real 3D model əlavə edin. Başqa obyektin modeli bu məhsul kimi göstərilməməlidir.</p>
    </section>
  );
}
