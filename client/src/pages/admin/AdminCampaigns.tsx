import { BarChart3, CalendarDays, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import ProductPicker, { PickedProduct } from "../../components/admin/ProductPicker";
import Alert from "../../components/common/Alert";
import DatePicker from "../../components/common/DatePicker";
import { confirmDialog, toast } from "../../components/common/Overlays";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { CampaignInput, extraService, fileToDataUrl } from "../../services/extra.service";
import { productService } from "../../services/product.service";
import { AdminCampaign, CampaignStats, CampaignStatus } from "../../types";
import { formatBaku, fromBakuInput, toBakuInput } from "../../utils/bakuTime";
import { formatPrice } from "../../utils/format";

type Line = PickedProduct & { specialPrice: string };

type Form = {
  name: string;
  description: string;
  bannerUrl: string;
  fridayOnly: boolean;
  discountPercent: string;
  categoryId: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  lines: Line[];
};

const initial = (): Form => {
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 86_400_000);
  return {
    name: "",
    description: "",
    bannerUrl: "",
    fridayOnly: false,
    discountPercent: "15",
    categoryId: "",
    startsAt: toBakuInput(start),
    endsAt: toBakuInput(end),
    isActive: true,
    lines: [],
  };
};

const toForm = (campaign: AdminCampaign): Form => ({
  name: campaign.name,
  description: campaign.description ?? "",
  bannerUrl: campaign.bannerUrl ?? "",
  fridayOnly: Boolean(campaign.fridayOnly),
  discountPercent: String(campaign.discountPercent),
  categoryId: campaign.categoryId ?? "",
  startsAt: toBakuInput(campaign.startsAt),
  endsAt: toBakuInput(campaign.endsAt),
  isActive: campaign.isActive,
  lines: campaign.products.map((entry) => ({
    id: entry.product.id,
    name: entry.product.name,
    price: entry.product.price,
    image: entry.product.images?.[0],
    stock: entry.product.stock,
    specialPrice: entry.specialPrice ?? "",
  })),
});

const statusStyles: Record<CampaignStatus, { label: string; style: string }> = {
  live: { label: "Davam edir", style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  scheduled: { label: "Planlaşdırılıb", style: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" },
  paused: { label: "Dayandırılıb", style: "bg-chip text-ink/60" },
  ended: { label: "Bitib", style: "bg-chip text-ink/60" },
};

function StatsPanel({ id }: { id: string }) {
  const stats = useAsync<CampaignStats>(() => extraService.campaignStats(id), [id]);
  if (stats.loading && !stats.data) return <Spinner />;
  if (stats.error || !stats.data) return <Alert>{stats.error ?? "Nəticələr yüklənmədi"}</Alert>;
  const data = stats.data;
  const ctr = data.impressions > 0 ? `${((data.clicks / data.impressions) * 100).toFixed(1)}%` : "—";
  const tiles = [
    { label: "Sifariş", value: String(data.orders) },
    { label: "Satılan ədəd", value: String(data.units) },
    { label: "Gəlir", value: formatPrice(data.revenue) },
    { label: "Müştəri qənaəti", value: formatPrice(data.savings) },
    { label: "Reklam göstərilməsi", value: String(data.impressions) },
    { label: "Klik · CTR", value: `${data.clicks} · ${ctr}` },
  ];
  return (
    <div className="space-y-3 rounded-2xl bg-chip/60 p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-surface p-2.5">
            <p className="text-[11px] text-muted">{tile.label}</p>
            <p className="truncate text-sm font-semibold tabular-nums">{tile.value}</p>
          </div>
        ))}
      </div>
      {data.topProducts.length > 0 && (
        <ul className="space-y-1 text-xs">
          {data.topProducts.map((product) => (
            <li key={product.productId} className="flex items-center justify-between gap-3">
              <span className="truncate">{product.name}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {product.units} əd · {formatPrice(product.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted">Ləğv edilmiş və pulu qaytarılmış sifarişlər nəzərə alınmır.</p>
    </div>
  );
}

export default function AdminCampaigns() {
  const campaigns = useAsync(() => extraService.campaigns(), []);
  const categories = useAsync(() => productService.categories(), []);
  const [form, setForm] = useState<Form>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statsId, setStatsId] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setForm(initial());
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
      set("bannerUrl", url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const payload = (): CampaignInput | null => {
    const startsAt = fromBakuInput(form.startsAt);
    const endsAt = fromBakuInput(form.endsAt);
    if (!startsAt || !endsAt) {
      setError("Başlanğıc və bitmə vaxtını seçin");
      return null;
    }
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      bannerUrl: form.bannerUrl.trim() || null,
      fridayOnly: form.fridayOnly,
      discountPercent: Number(form.discountPercent || 0),
      categoryId: form.lines.length ? null : form.categoryId || null,
      products: form.lines.map((line) => ({ productId: line.id, specialPrice: line.specialPrice ? Number(line.specialPrice) : null })),
      startsAt,
      endsAt,
      isActive: form.isActive,
    };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = payload();
    if (!body) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) await extraService.updateCampaign(editingId, body);
      else await extraService.createCampaign(body);
      toast(editingId ? "Kampaniya yeniləndi" : "Kampaniya yaradıldı");
      reset();
      await campaigns.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const act = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast(message, "info");
      await campaigns.reload();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const remove = async (campaign: AdminCampaign) => {
    const confirmed = await confirmDialog(`“${campaign.name}” silinsin?`, {
      description: "Kampaniya və onun məhsul siyahısı silinəcək. Keçmiş sifarişlərin qiymətləri dəyişməyəcək.",
      confirmLabel: "Sil",
    });
    if (!confirmed) return;
    if (editingId === campaign.id) reset();
    await act(() => extraService.deleteCampaign(campaign.id), "Kampaniya silindi");
  };

  const percent = Number(form.discountPercent || 0);
  const preview = (line: Line) => {
    const base = Number(line.price);
    const special = Number(line.specialPrice);
    if (line.specialPrice && special > 0 && special < base) return special;
    return percent > 0 ? Math.round(base * (100 - percent)) / 100 : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kampaniyalar</h1>
        <p className="text-sm text-muted">
          Endirimlər səbət, ödəniş və sifarişdə serverdə hesablanır. Bir məhsula eyni anda yalnız bir endirim tətbiq olunur, ən sərfəlisi seçilir. Bütün vaxtlar Bakı vaxtıdır.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{editingId ? "Kampaniyanı redaktə et" : "Yeni kampaniya"}</h2>
          {editingId && (
            <button type="button" className="text-sm text-muted hover:text-ink" onClick={reset}>
              Ləğv et
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Ad *</span>
            <input className="input" required minLength={2} maxLength={80} placeholder="Cümə endirimləri" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Endirim (%)</span>
            <input className="input" type="number" min={0} max={90} value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} />
            <span className="block text-xs text-muted">Xüsusi qiyməti olmayan məhsullara tətbiq olunur. Yalnız xüsusi qiymət istifadə edirsinizsə 0 yazın.</span>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Əhatə</span>
            <Select
              ariaLabel="Kateqoriya"
              value={form.lines.length ? "__products" : form.categoryId}
              disabled={form.lines.length > 0}
              onChange={(categoryId) => set("categoryId", categoryId)}
              options={[
                ...(form.lines.length ? [{ value: "__products", label: "Seçilmiş məhsullar" }] : []),
                { value: "", label: "Bütün məhsullar" },
                ...(categories.data ?? []).map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </label>
          <label className="space-y-1 sm:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium">Açıqlama</span>
            <textarea className="input min-h-[70px]" maxLength={400} placeholder="Seçilmiş smartfon və aksesuarlarda yalnız cümə günü keçərli qiymətlər" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <div className="space-y-1">
            <span className="text-sm font-medium">Başlayır (Bakı vaxtı) *</span>
            <DatePicker withTime required ariaLabel="Başlayır" value={form.startsAt} onChange={(next) => set("startsAt", next)} />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Bitir (Bakı vaxtı) *</span>
            <DatePicker withTime required ariaLabel="Bitir" min={form.startsAt.slice(0, 10)} value={form.endsAt} onChange={(next) => set("endsAt", next)} />
          </div>
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5" checked={form.fridayOnly} onChange={(e) => set("fridayOnly", e.target.checked)} />
              <span>
                <span className="font-medium">Yalnız cümə günləri</span>
                <span className="block text-xs text-muted">Bu tarixlər arasında hər cümə 00:00–23:59 aktivdir və Friday Deals bölməsində görünür.</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Aktiv
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Banner şəkli</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {form.bannerUrl && (
              <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-[#111317]">
                <img src={form.bannerUrl} alt="" className="h-full w-full object-contain" />
                <button type="button" aria-label="Banneri sil" onClick={() => set("bannerUrl", "")} className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white">
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
            <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files)} />
              <ImagePlus className="size-4" strokeWidth={1.8} aria-hidden="true" />
              {uploading ? "Yüklənir..." : "Şəffaf fonlu PNG və ya WebP yüklə (maks. 2 MB)"}
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">Məhsullar {form.lines.length > 0 && <span className="text-muted">({form.lines.length})</span>}</span>
            <span className="text-xs text-muted">Məhsul seçməsəniz endirim yuxarıdakı əhatəyə tətbiq olunur.</span>
          </div>
          <ProductPicker
            excluded={form.lines.map((line) => line.id)}
            onPick={(product) => set("lines", [...form.lines, { ...product, specialPrice: "" }].slice(0, 200))}
          />
          {form.lines.length > 0 && (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {form.lines.map((line) => {
                const next = preview(line);
                return (
                  <li key={line.id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-muted">
                        {formatPrice(line.price)}
                        {next !== null && <span className="font-semibold text-red-600"> → {formatPrice(next)}</span>}
                        {line.stock !== undefined && line.stock <= 0 && <span className="text-amber-600"> · Stokda yoxdur</span>}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <span className="text-muted">Xüsusi qiymət</span>
                      <input
                        className="input h-9 w-28 py-1 text-sm"
                        type="number"
                        min={0.01}
                        step={0.01}
                        max={Number(line.price) - 0.01}
                        placeholder="—"
                        value={line.specialPrice}
                        onChange={(e) => set("lines", form.lines.map((item) => (item.id === line.id ? { ...item, specialPrice: e.target.value } : item)))}
                      />
                    </label>
                    <button type="button" aria-label={`${line.name} sil`} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-chip hover:text-red-600" onClick={() => set("lines", form.lines.filter((item) => item.id !== line.id))}>
                      <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && <Alert>{error}</Alert>}
        <button className="btn-primary w-full sm:w-auto" disabled={saving || uploading}>
          {saving ? "Saxlanılır..." : editingId ? "Dəyişiklikləri saxla" : "Kampaniya yarat"}
        </button>
      </form>

      {campaigns.loading && !campaigns.data ? (
        <Spinner />
      ) : campaigns.error ? (
        <Alert>{campaigns.error}</Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {campaigns.data?.length === 0 && <p className="card p-8 text-center text-sm text-muted lg:col-span-2">Hələ kampaniya yoxdur</p>}
          {campaigns.data?.map((campaign) => {
            const state = statusStyles[campaign.status];
            const scope = campaign.products.length ? `${campaign.products.length} seçilmiş məhsul` : (campaign.category?.name ?? "Bütün məhsullar");
            return (
              <article key={campaign.id} className={`card flex flex-col gap-3 p-5 ${editingId === campaign.id ? "ring-2 ring-brand-500" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold">{campaign.name}</p>
                      {campaign.fridayOnly && <span className="rounded-full bg-[#111317] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#c9945c]">Cümə</span>}
                    </div>
                    <p className="text-sm text-muted">{scope}</p>
                  </div>
                  {campaign.discountPercent > 0 ? (
                    <span className="shrink-0 text-2xl font-bold text-red-600">−{campaign.discountPercent}%</span>
                  ) : (
                    <span className="shrink-0 text-sm font-semibold text-red-600">Xüsusi qiymət</span>
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <CalendarDays className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {formatBaku(campaign.startsAt)} → {formatBaku(campaign.endsAt)}
                </p>
                {campaign.status === "live" && campaign.currentEndsAt && <p className="text-xs text-emerald-700 dark:text-emerald-300">İndi aktivdir · {formatBaku(campaign.currentEndsAt)}-dək</p>}
                {campaign.status === "scheduled" && campaign.nextStartsAt && <p className="text-xs text-sky-700 dark:text-sky-300">Növbəti başlanğıc: {formatBaku(campaign.nextStartsAt)}</p>}
                {statsId === campaign.id && <StatsPanel id={campaign.id} />}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state.style}`}>{state.label}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" className="btn-outline gap-1.5 px-3 py-1.5 text-xs" onClick={() => setStatsId(statsId === campaign.id ? null : campaign.id)}>
                      <BarChart3 className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                      Nəticələr
                    </button>
                    <button
                      type="button"
                      className="btn-outline gap-1.5 px-3 py-1.5 text-xs"
                      onClick={() => {
                        setEditingId(campaign.id);
                        setForm(toForm(campaign));
                        setError(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                      Redaktə
                    </button>
                    <button
                      type="button"
                      className="btn-outline px-3 py-1.5 text-xs"
                      onClick={() => void act(() => extraService.updateCampaign(campaign.id, { isActive: !campaign.isActive }), campaign.isActive ? "Kampaniya dayandırıldı" : "Kampaniya aktivləşdirildi")}
                    >
                      {campaign.isActive ? "Dayandır" : "Aktivləşdir"}
                    </button>
                    <button type="button" className="btn-outline px-3 py-1.5 text-xs text-red-600" onClick={() => void remove(campaign)}>
                      Sil
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
