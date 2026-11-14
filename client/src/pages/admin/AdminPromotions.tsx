import { ArrowDown, ArrowUp, Eye, ImagePlus, MousePointerClick, Pencil, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import Alert from "../../components/common/Alert";
import DatePicker from "../../components/common/DatePicker";
import { confirmDialog, toast } from "../../components/common/Overlays";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import PromoCard from "../../components/home/PromoCard";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { extraService, fileToDataUrl } from "../../services/extra.service";
import { promotionService } from "../../services/promotion.service";
import { AdminPromotion, PromotionInput, PromotionPlacement } from "../../types";
import { formatBaku, fromBakuInput, toBakuInput } from "../../utils/bakuTime";

const placements: { value: PromotionPlacement; label: string; hint: string }[] = [
  { value: "HERO_SIDE", label: "Slayderin yanı", hint: "Ana səhifədə slayderin sağındakı 2 kart. İlk 2 aktiv reklam göstərilir." },
  { value: "HOME_BANNER", label: "Ana səhifə bannerləri", hint: "Kateqoriyalardan sonra geniş kartlar, ən çox 4 ədəd." },
  { value: "FRIDAY", label: "Friday Deals bölməsi", hint: "Cümə endirimləri aktiv olanda kampaniya bannerinin altında, ən çox 2 ədəd." },
];

const placementLabel = (value: PromotionPlacement) => placements.find((item) => item.value === value)?.label ?? value;

type Form = Omit<PromotionInput, "startsAt" | "endsAt" | "description" | "eyebrow" | "ctaText" | "link"> & {
  description: string;
  eyebrow: string;
  ctaText: string;
  link: string;
  startsAt: string;
  endsAt: string;
};

const empty = (placement: PromotionPlacement = "HERO_SIDE"): Form => ({
  title: "",
  description: "",
  eyebrow: "",
  imageUrl: "",
  ctaText: "Bax",
  link: "/products",
  placement,
  campaignId: null,
  startsAt: "",
  endsAt: "",
  isActive: true,
});

const toForm = (promotion: AdminPromotion): Form => ({
  title: promotion.title,
  description: promotion.description ?? "",
  eyebrow: promotion.eyebrow ?? "",
  imageUrl: promotion.imageUrl,
  ctaText: promotion.ctaText ?? "",
  link: promotion.link ?? "",
  placement: promotion.placement,
  campaignId: promotion.campaignId,
  startsAt: toBakuInput(promotion.startsAt),
  endsAt: toBakuInput(promotion.endsAt),
  isActive: promotion.isActive,
});

const toInput = (form: Form): PromotionInput => ({
  title: form.title.trim(),
  description: form.description.trim() || null,
  eyebrow: form.eyebrow.trim() || null,
  imageUrl: form.imageUrl.trim(),
  ctaText: form.ctaText.trim() || null,
  link: form.link.trim() || null,
  placement: form.placement,
  campaignId: form.campaignId || null,
  startsAt: fromBakuInput(form.startsAt),
  endsAt: fromBakuInput(form.endsAt),
  isActive: form.isActive,
});

const scheduleOf = (promotion: AdminPromotion) => {
  const now = Date.now();
  if (!promotion.isActive) return { label: "Deaktiv", style: "bg-chip text-muted" };
  if (promotion.endsAt && new Date(promotion.endsAt).getTime() <= now) return { label: "Vaxtı bitib", style: "bg-chip text-muted" };
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) return { label: "Planlaşdırılıb", style: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" };
  return { label: "Göstərilir", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" };
};

export default function AdminPromotions() {
  const promotions = useAsync(() => promotionService.list(), []);
  const campaigns = useAsync(() => extraService.campaigns().catch(() => []), []);
  const [form, setForm] = useState<Form>(() => empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  const grouped = useMemo(
    () => placements.map((placement) => ({ ...placement, items: (promotions.data ?? []).filter((item) => item.placement === placement.value) })),
    [promotions.data],
  );

  const reset = (placement?: PromotionPlacement) => {
    setForm(empty(placement ?? form.placement));
    setEditingId(null);
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
      if (editingId) {
        const updated = await promotionService.update(editingId, toInput(form));
        promotions.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
        toast("Reklam yeniləndi");
      } else {
        const created = await promotionService.create(toInput(form));
        promotions.setData((current) => [...(current ?? []), created]);
        toast("Reklam əlavə edildi");
      }
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (promotion: AdminPromotion) => {
    setBusyId(promotion.id);
    try {
      const updated = await promotionService.update(promotion.id, { isActive: !promotion.isActive });
      promotions.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (placement: PromotionPlacement, items: AdminPromotion[], position: number, delta: number) => {
    const target = position + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[position], next[target]] = [next[target], next[position]];
    const previous = promotions.data;
    const order = new Map(next.map((item, index) => [item.id, index]));
    promotions.setData((current) => current?.map((item) => (order.has(item.id) ? { ...item, sortOrder: order.get(item.id)! } : item)).sort((a, b) => a.sortOrder - b.sortOrder) ?? null);
    try {
      await promotionService.reorder(placement, next.map((item) => item.id));
    } catch (err) {
      promotions.setData(previous ?? null);
      toast(getErrorMessage(err), "error");
    }
  };

  const remove = async (promotion: AdminPromotion) => {
    if (!(await confirmDialog(`“${promotion.title}” reklamı silinsin?`, { description: "Reklam və onun statistikası silinəcək. Bu əməliyyat geri qaytarıla bilməz.", confirmLabel: "Sil" }))) return;
    setBusyId(promotion.id);
    try {
      await promotionService.remove(promotion.id);
      promotions.setData((current) => current?.filter((item) => item.id !== promotion.id) ?? null);
      if (editingId === promotion.id) reset();
      toast("Reklam silindi", "info");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const hint = placements.find((item) => item.value === form.placement)?.hint;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reklamlar</h1>
        <p className="text-sm text-muted">
          Ana səhifədəki reklam kartlarını idarə edin. Göstərilmə ekranda ən az yarısı görünəndə, klik isə kartın üzərinə basanda sayılır. Vaxtlar Bakı vaxtıdır.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          {promotions.loading && !promotions.data ? (
            <Spinner />
          ) : promotions.error ? (
            <Alert>{promotions.error}</Alert>
          ) : (
            grouped.map((group) => (
              <section key={group.value} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{group.label}</h2>
                    <p className="text-xs text-muted">{group.hint}</p>
                  </div>
                  <button type="button" className="text-sm font-medium text-brand-600" onClick={() => reset(group.value)}>
                    + Əlavə et
                  </button>
                </div>
                {group.items.length === 0 ? (
                  <p className="rounded-xl bg-chip/60 px-3 py-4 text-center text-sm text-muted">
                    {group.value === "HERO_SIDE"
                      ? "Reklam yoxdur, standart Noutbuklar və Aksesuarlar kartları göstərilir."
                      : group.value === "FRIDAY"
                        ? "Reklam yoxdur. Friday Deals bölməsi reklamsız göstərilir."
                        : "Reklam yoxdur, bu bölmə ana səhifədə gizlədilir."}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {group.items.map((promotion, position) => {
                      const state = scheduleOf(promotion);
                      const ctr = promotion.impressions > 0 ? `${((promotion.clicks / promotion.impressions) * 100).toFixed(1)}%` : "—";
                      return (
                        <li
                          key={promotion.id}
                          className={`flex flex-wrap items-center gap-4 rounded-2xl border p-3 ${editingId === promotion.id ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" : "border-line"} ${promotion.isActive ? "" : "opacity-60"}`}
                        >
                          <img src={promotion.imageUrl} alt="" className="size-16 shrink-0 rounded-xl bg-[#111317] object-contain p-1.5" />
                          <div className="min-w-0 flex-1 basis-44 space-y-1">
                            <p className="truncate font-medium">{promotion.title}</p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className={`rounded-full px-2 py-0.5 font-medium ${state.style}`}>{state.label}</span>
                              {promotion.campaign && <span className="max-w-[160px] truncate rounded-full bg-chip px-2 py-0.5 font-medium text-muted">{promotion.campaign.name}</span>}
                              {(promotion.startsAt || promotion.endsAt) && (
                                <span className="text-muted">
                                  {formatBaku(promotion.startsAt)} → {formatBaku(promotion.endsAt)}
                                </span>
                              )}
                            </div>
                            <p className="flex flex-wrap items-center gap-3 text-xs tabular-nums text-muted">
                              <span className="inline-flex items-center gap-1">
                                <Eye className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                                {promotion.impressions}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MousePointerClick className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                                {promotion.clicks}
                              </span>
                              <span>CTR {ctr}</span>
                            </p>
                          </div>
                          <div className="flex w-full flex-wrap items-center gap-1.5 2xl:w-auto">
                            <button type="button" className="btn-outline size-9 p-0" aria-label="Yuxarı" disabled={position === 0} onClick={() => void move(group.value, group.items, position, -1)}>
                              <ArrowUp className="size-4" strokeWidth={1.8} aria-hidden="true" />
                            </button>
                            <button type="button" className="btn-outline size-9 p-0" aria-label="Aşağı" disabled={position === group.items.length - 1} onClick={() => void move(group.value, group.items, position, 1)}>
                              <ArrowDown className="size-4" strokeWidth={1.8} aria-hidden="true" />
                            </button>
                            <button type="button" className="btn-outline px-3 py-2 text-xs" disabled={busyId === promotion.id} onClick={() => void toggle(promotion)}>
                              {promotion.isActive ? "Deaktiv et" : "Aktiv et"}
                            </button>
                            <button
                              type="button"
                              className="btn-outline gap-1.5 px-3 py-2 text-xs"
                              onClick={() => {
                                setEditingId(promotion.id);
                                setForm(toForm(promotion));
                                setError(null);
                              }}
                            >
                              <Pencil className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                              Redaktə
                            </button>
                            <button type="button" className="btn-outline size-9 p-0 text-red-600" aria-label="Sil" disabled={busyId === promotion.id} onClick={() => void remove(promotion)}>
                              <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>

        <form onSubmit={submit} className="card h-fit space-y-4 p-5 xl:sticky xl:top-20">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingId ? "Reklamı redaktə et" : "Yeni reklam"}</h2>
            {editingId && (
              <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => reset()}>
                Ləğv et
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-[#0b0c0f] p-3">
            <PromoCard
              tracked={false}
              preview
              size={form.placement === "HERO_SIDE" ? "side" : "wide"}
              promo={{ title: form.title || "Başlıq", description: form.description, eyebrow: form.eyebrow, imageUrl: form.imageUrl || "/illustrations/smartphones.svg", ctaText: form.ctaText, link: form.link || null }}
            />
          </div>

          {error && <Alert>{error}</Alert>}

          <div className="space-y-1">
            <span className="text-sm font-medium">Göstərilmə yeri</span>
            <Select ariaLabel="Göstərilmə yeri" value={form.placement} onChange={(value) => set("placement", value as PromotionPlacement)} options={placements.map((item) => ({ value: item.value, label: item.label }))} />
            {hint && <span className="block text-xs text-muted">{hint}</span>}
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Başlıq *</span>
            <input className="input" required minLength={2} maxLength={90} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Qısa açıqlama</span>
            <textarea className="input min-h-[70px]" maxLength={220} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Kiçik etiket</span>
            <input className="input" maxLength={40} placeholder="Yeni" value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium">Şəkil *</span>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files)} />
              <ImagePlus className="size-4" strokeWidth={1.8} aria-hidden="true" />
              {uploading ? "Yüklənir..." : "Şəffaf fonlu məhsul şəkli yüklə (maks. 2 MB)"}
            </label>
            <input className="input" required placeholder="https://... və ya /uploads/..." value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Düymə mətni</span>
              <input className="input" maxLength={30} value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Keçid linki</span>
              <input className="input" maxLength={300} placeholder="/campaigns/..." value={form.link} onChange={(e) => set("link", e.target.value)} />
            </label>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Kampaniya</span>
            <Select
              ariaLabel="Kampaniya"
              value={form.campaignId ?? ""}
              onChange={(value) => set("campaignId", value || null)}
              options={[{ value: "", label: "Əlaqəsiz" }, ...(campaigns.data ?? []).filter((campaign) => campaign.status !== "ended" || campaign.id === form.campaignId).map((campaign) => ({ value: campaign.id, label: campaign.name }))]}
            />
            <span className="block text-xs text-muted">Kampaniya bitəndə və ya dayandırılanda reklam avtomatik gizlənir, aktiv olanda endirim faizi kartda göstərilir.</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm font-medium">Başlayır</span>
              <DatePicker withTime ariaLabel="Başlayır" value={form.startsAt} onChange={(next) => set("startsAt", next)} />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">Bitir</span>
              <DatePicker withTime ariaLabel="Bitir" min={form.startsAt.slice(0, 10) || undefined} value={form.endsAt} onChange={(next) => set("endsAt", next)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Aktiv
          </label>
          <button className="btn-primary w-full" disabled={saving || uploading}>
            {saving ? "Saxlanılır..." : editingId ? "Dəyişiklikləri saxla" : `${placementLabel(form.placement)} üçün əlavə et`}
          </button>
        </form>
      </div>
    </div>
  );
}
