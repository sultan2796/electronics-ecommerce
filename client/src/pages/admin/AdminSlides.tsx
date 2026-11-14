import { FormEvent, useState } from "react";
import Alert from "../../components/common/Alert";
import { confirmDialog, toast } from "../../components/common/Overlays";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { extraService, fileToDataUrl } from "../../services/extra.service";
import { slideService } from "../../services/slide.service";
import { AdminSlide, SlideInput } from "../../types";

const empty: SlideInput = { title: "", subtitle: "", eyebrow: "", imageUrl: "", videoUrl: "", buttonText: "", buttonLink: "/products", isActive: true };

const toForm = (slide: AdminSlide): SlideInput => ({
  title: slide.title,
  subtitle: slide.subtitle ?? "",
  eyebrow: slide.eyebrow ?? "",
  imageUrl: slide.imageUrl,
  videoUrl: slide.videoUrl ?? "",
  buttonText: slide.buttonText ?? "",
  buttonLink: slide.buttonLink ?? "",
  isActive: slide.isActive,
});

const clean = (form: SlideInput): SlideInput => ({
  ...form,
  title: form.title.trim(),
  subtitle: form.subtitle?.trim() || null,
  eyebrow: form.eyebrow?.trim() || null,
  imageUrl: form.imageUrl.trim(),
  videoUrl: form.videoUrl?.trim() || null,
  buttonText: form.buttonText?.trim() || null,
  buttonLink: form.buttonLink?.trim() || null,
});

function SlidePreview({ form }: { form: SlideInput }) {
  return (
    <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-[#0f172a]">
      {form.imageUrl && <img src={form.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />}
      {form.videoUrl && /^https:\/\/[^?#]+\.(mp4|webm)/i.test(form.videoUrl) && (
        <video key={form.videoUrl} src={form.videoUrl} poster={form.imageUrl || undefined} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover opacity-90" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/60 to-transparent" />
      <div className="relative flex h-full max-w-[70%] flex-col justify-center gap-2 p-5 text-white">
        {form.eyebrow && <span className="w-fit rounded-full border border-white/25 px-2 py-0.5 text-[10px] uppercase tracking-wider">{form.eyebrow}</span>}
        <p className="text-lg font-bold leading-tight sm:text-2xl">{form.title || "Başlıq"}</p>
        {form.subtitle && <p className="line-clamp-2 text-xs text-white/75 sm:text-sm">{form.subtitle}</p>}
        {form.buttonText && <span className="mt-1 w-fit rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold">{form.buttonText}</span>}
      </div>
    </div>
  );
}

export default function AdminSlides() {
  const slides = useAsync(() => slideService.list(), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlideInput>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const set = <K extends keyof SlideInput>(key: K, value: SlideInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setEditingId(null);
    setForm(empty);
    setError(null);
  };

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await extraService.upload(await fileToDataUrl(file));
      set("imageUrl", url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = clean(form);
      if (editingId) {
        const updated = await slideService.update(editingId, payload);
        slides.setData((current) => current?.map((slide) => (slide.id === updated.id ? updated : slide)) ?? null);
        toast("Slayd yeniləndi");
      } else {
        const created = await slideService.create(payload);
        slides.setData((current) => [...(current ?? []), created]);
        toast("Slayd əlavə edildi");
      }
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (slide: AdminSlide) => {
    setBusyId(slide.id);
    try {
      const updated = await slideService.update(slide.id, { isActive: !slide.isActive });
      slides.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (position: number, delta: number) => {
    const list = slides.data ?? [];
    const target = position + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[position], next[target]] = [next[target], next[position]];
    slides.setData(next);
    try {
      slides.setData(await slideService.reorder(next.map((slide) => slide.id)));
    } catch (err) {
      slides.setData(list);
      toast(getErrorMessage(err), "error");
    }
  };

  const remove = async (slide: AdminSlide) => {
    if (!(await confirmDialog(`“${slide.title}” slaydı silinsin?`, { description: "Bu əməliyyat geri qaytarıla bilməz.", confirmLabel: "Sil" }))) return;
    setBusyId(slide.id);
    try {
      await slideService.remove(slide.id);
      slides.setData((current) => current?.filter((item) => item.id !== slide.id) ?? null);
      if (editingId === slide.id) reset();
      toast("Slayd silindi", "info");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ana səhifə slaydları</h1>
        <p className="text-sm text-muted">Aktiv slaydlar ana səhifədə sıra ilə göstərilir. Slayd yoxdursa, standart brend slaydı görünür.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="card space-y-3 p-5">
          <h2 className="font-semibold">Slaydlar</h2>
          {slides.loading ? (
            <Spinner />
          ) : slides.error ? (
            <Alert>{slides.error}</Alert>
          ) : !slides.data?.length ? (
            <p className="py-6 text-center text-sm text-muted">Hələ slayd yoxdur. Sağdakı formadan ilk slaydı əlavə edin.</p>
          ) : (
            <ul className="space-y-3">
              {slides.data.map((slide, position) => (
                <li
                  key={slide.id}
                  className={`flex flex-wrap items-center gap-4 rounded-2xl border p-3 transition ${editingId === slide.id ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" : "border-line"} ${slide.isActive ? "" : "opacity-60"}`}
                >
                  <img src={slide.imageUrl} alt="" className="h-16 w-28 shrink-0 rounded-xl bg-chip object-cover" />
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-medium">{slide.title}</p>
                    <p className="truncate text-xs text-muted">{slide.subtitle ?? "—"}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${slide.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-chip text-muted"}`}>
                      {slide.isActive ? "Aktiv" : "Deaktiv"}
                    </span>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-1.5 2xl:w-auto">
                    <button type="button" className="btn-outline size-9 p-0" aria-label="Yuxarı" disabled={position === 0} onClick={() => void move(position, -1)}>
                      ↑
                    </button>
                    <button type="button" className="btn-outline size-9 p-0" aria-label="Aşağı" disabled={position === slides.data!.length - 1} onClick={() => void move(position, 1)}>
                      ↓
                    </button>
                    <button type="button" className="btn-outline px-3 py-2 text-xs" disabled={busyId === slide.id} onClick={() => void toggle(slide)}>
                      {slide.isActive ? "Deaktiv et" : "Aktiv et"}
                    </button>
                    <button
                      type="button"
                      className="btn-outline px-3 py-2 text-xs"
                      onClick={() => {
                        setEditingId(slide.id);
                        setForm(toForm(slide));
                        setError(null);
                      }}
                    >
                      Redaktə
                    </button>
                    <button type="button" className="btn-outline px-3 py-2 text-xs text-red-600" disabled={busyId === slide.id} onClick={() => void remove(slide)}>
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={submit} className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingId ? "Slaydı redaktə et" : "Yeni slayd"}</h2>
            {editingId && (
              <button type="button" className="text-sm text-muted hover:text-ink" onClick={reset}>
                Ləğv et
              </button>
            )}
          </div>
          <SlidePreview form={form} />
          {error && <Alert>{error}</Alert>}
          <label className="block space-y-1">
            <span className="text-sm font-medium">Başlıq *</span>
            <input className="input" required minLength={2} maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Açıqlama</span>
            <textarea className="input min-h-[80px]" maxLength={300} value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Kiçik etiket</span>
            <input className="input" maxLength={60} placeholder="Yeni kolleksiya" value={form.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium">Şəkil *</span>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files)} />
              {uploading ? "Yüklənir..." : "Kompüterdən şəkil yüklə (maks. 2 MB, tövsiyə 1600×700)"}
            </label>
            <input className="input" required placeholder="https://... və ya /figma/hero.jpg" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Fon videosu (istəyə bağlı)</span>
            <input
              className="input"
              maxLength={500}
              placeholder="https://.../video.mp4"
              value={form.videoUrl ?? ""}
              onChange={(e) => set("videoUrl", e.target.value)}
            />
            <span className="block text-xs text-muted">
              .mp4 və ya .webm faylının birbaşa https linki. Video səssiz və təkrarlanan oynayır, şəkil isə yüklənənə qədər və qənaət rejimində göstərilir. Tövsiyə: 10–15 saniyə, 5 MB-dan kiçik.
            </span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Düymə mətni</span>
              <input className="input" maxLength={40} placeholder="İndi al" value={form.buttonText ?? ""} onChange={(e) => set("buttonText", e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Düymə keçidi</span>
              <input className="input" maxLength={300} placeholder="/products?category=laptops" value={form.buttonLink ?? ""} onChange={(e) => set("buttonLink", e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Ana səhifədə göstər
          </label>
          <button className="btn-primary w-full" disabled={saving || uploading}>
            {saving ? "Saxlanılır..." : editingId ? "Dəyişiklikləri saxla" : "Slayd əlavə et"}
          </button>
        </form>
      </div>
    </div>
  );
}
