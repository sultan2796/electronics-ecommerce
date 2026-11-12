import { confirmDialog } from "../../components/common/Overlays";
import Select from "../../components/common/Select";
import { FormEvent, useState } from "react";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { extraService } from "../../services/extra.service";
import { productService } from "../../services/product.service";
import { Campaign } from "../../types";
import { formatDate } from "../../utils/format";

const toLocalInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const initial = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 3 * 86_400_000);
  return { name: "", discountPercent: "15", categoryId: "", startsAt: toLocalInput(start), endsAt: toLocalInput(end), isActive: true };
};

const stateOf = (campaign: Campaign) => {
  const now = Date.now();
  if (!campaign.isActive) return { label: "Dayandırılıb", style: "bg-chip text-ink/60" };
  if (new Date(campaign.startsAt).getTime() > now) return { label: "Planlaşdırılıb", style: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" };
  if (new Date(campaign.endsAt).getTime() <= now) return { label: "Bitib", style: "bg-chip text-ink/60" };
  return { label: "Davam edir", style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" };
};

export default function AdminCampaigns() {
  const campaigns = useAsync(() => extraService.campaigns(), []);
  const categories = useAsync(() => productService.categories(), []);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await extraService.createCampaign({
        name: form.name.trim(),
        discountPercent: Number(form.discountPercent),
        categoryId: form.categoryId || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isActive: form.isActive,
      });
      setForm(initial());
      await campaigns.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const act = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      await campaigns.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const set = (key: keyof ReturnType<typeof initial>, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kampaniyalar</h1>
        <p className="text-sm text-muted">Taymerli endirimlər bütün sayta və ya seçilmiş kateqoriyaya avtomatik tətbiq olunur və ana səhifədə geri sayımla göstərilir</p>
      </div>

      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm font-medium">Ad</span>
          <input className="input" required minLength={2} placeholder="Black Friday" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Endirim (%)</span>
          <input className="input" type="number" min={1} max={90} required value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Kateqoriya</span>
          <Select
            ariaLabel="Kateqoriya"
            value={form.categoryId}
            onChange={(categoryId) => set("categoryId", categoryId)}
            options={[{ value: "", label: "Bütün məhsullar" }, ...(categories.data ?? []).map((category) => ({ value: category.id, label: category.name }))]}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Başlayır</span>
          <input className="input" type="datetime-local" required value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Bitir</span>
          <input className="input" type="datetime-local" required value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </label>
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? "Yaradılır..." : "Kampaniya yarat"}
          </button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {campaigns.loading && !campaigns.data ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.data?.length === 0 && <p className="card p-8 text-center text-sm text-muted md:col-span-2">Hələ kampaniya yoxdur</p>}
          {campaigns.data?.map((campaign) => {
            const state = stateOf(campaign);
            return (
              <article key={campaign.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{campaign.name}</p>
                    <p className="text-sm text-muted">{campaign.category?.name ?? "Bütün məhsullar"}</p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">−{campaign.discountPercent}%</span>
                </div>
                <p className="text-xs text-muted">
                  {formatDate(campaign.startsAt)} → {formatDate(campaign.endsAt)}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state.style}`}>{state.label}</span>
                  <div className="space-x-3 text-xs font-medium">
                    <button type="button" className="text-brand-600" onClick={() => act(() => extraService.updateCampaign(campaign.id, { isActive: !campaign.isActive }))}>
                      {campaign.isActive ? "Dayandır" : "Aktivləşdir"}
                    </button>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={async () => (await confirmDialog(`${campaign.name} silinsin?`, { confirmLabel: "Sil" })) && act(() => extraService.deleteCampaign(campaign.id))}
                    >
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
