import { confirmDialog } from "../../components/common/Overlays";
import DatePicker from "../../components/common/DatePicker";
import Select from "../../components/common/Select";
import { FormEvent, useState } from "react";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { CouponInput, extraService } from "../../services/extra.service";
import { Coupon } from "../../types";
import { formatDate, formatPrice } from "../../utils/format";

const empty = { code: "", type: "PERCENT" as const, value: "10", minTotal: "0", maxUses: "", expiresAt: "", isActive: true };

type FormState = Omit<typeof empty, "type"> & { type: Coupon["type"] };

const statusOf = (coupon: Coupon) => {
  if (!coupon.isActive) return { label: "Deaktiv", style: "bg-chip text-ink/60" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { label: "Müddəti bitib", style: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { label: "Limit dolub", style: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" };
  return { label: "Aktiv", style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" };
};

export default function AdminCoupons() {
  const coupons = useAsync(() => extraService.coupons(), []);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const payload = (): CouponInput => ({
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: Number(form.value),
    minTotal: Number(form.minTotal) || 0,
    maxUses: form.maxUses ? Number(form.maxUses) : null,
    expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
    isActive: form.isActive,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await extraService.createCoupon(payload());
      coupons.setData((current) => [created, ...(current ?? [])]);
      setForm(empty);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon: Coupon) => {
    try {
      const updated = await extraService.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      coupons.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!(await confirmDialog(`${coupon.code} silinsin?`, { confirmLabel: "Sil" }))) return;
    try {
      await extraService.deleteCoupon(coupon.id);
      coupons.setData((current) => current?.filter((item) => item.id !== coupon.id) ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const set = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promo kodlar</h1>
        <p className="text-sm text-muted">Müştərilər ödəniş səhifəsində kodu daxil edib endirim alır</p>
      </div>

      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-sm font-medium">Kod</span>
          <input className="input uppercase" required minLength={3} placeholder="YAY10" value={form.code} onChange={(e) => set("code", e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Növ</span>
          <Select
            ariaLabel="Növ"
            value={form.type}
            onChange={(type) => set("type", type)}
            options={[
              { value: "PERCENT", label: "Faiz (%)", hint: "Məbləğin faizi qədər" },
              { value: "FIXED", label: "Məbləğ (₼)", hint: "Sabit məbləğ çıxılır" },
            ]}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Dəyər</span>
          <input className="input" type="number" min="0.01" step="0.01" max={form.type === "PERCENT" ? 100 : undefined} required value={form.value} onChange={(e) => set("value", e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Minimum sifariş (₼)</span>
          <input className="input" type="number" min="0" step="0.01" value={form.minTotal} onChange={(e) => set("minTotal", e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">İstifadə limiti</span>
          <input className="input" type="number" min="1" placeholder="Limitsiz" value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} />
        </label>
        <div className="space-y-1">
          <span className="text-sm font-medium">Son tarix</span>
          <DatePicker ariaLabel="Son tarix" placeholder="Limitsiz" min={new Date().toISOString().slice(0, 10)} value={form.expiresAt} onChange={(next) => set("expiresAt", next)} />
        </div>
        <label className="flex items-end gap-2 pb-3 text-sm">
          <input type="checkbox" className="accent-brand-600" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Dərhal aktiv
        </label>
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? "Yaradılır..." : "Kod yarat"}
          </button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {coupons.loading && !coupons.data ? (
        <Spinner />
      ) : coupons.error ? (
        <Alert>{coupons.error}</Alert>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-chip">
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Endirim</th>
                <th className="px-4 py-3">Minimum</th>
                <th className="px-4 py-3">İstifadə</th>
                <th className="px-4 py-3">Son tarix</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    Hələ promo kod yoxdur
                  </td>
                </tr>
              )}
              {coupons.data?.map((coupon) => {
                const status = statusOf(coupon);
                return (
                  <tr key={coupon.id} className="border-b border-chip last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold">{coupon.code}</td>
                    <td className="px-4 py-3">{coupon.type === "PERCENT" ? `${Number(coupon.value)}%` : formatPrice(coupon.value)}</td>
                    <td className="px-4 py-3 text-muted">{Number(coupon.minTotal) > 0 ? formatPrice(coupon.minTotal) : "—"}</td>
                    <td className="px-4 py-3">
                      {coupon.usedCount}
                      {coupon.maxUses !== null && <span className="text-muted"> / {coupon.maxUses}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.style}`}>{status.label}</span>
                    </td>
                    <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right text-xs font-medium">
                      <button type="button" className="text-brand-600" onClick={() => toggle(coupon)}>
                        {coupon.isActive ? "Dayandır" : "Aktivləşdir"}
                      </button>
                      <button type="button" className="text-red-600" onClick={() => remove(coupon)}>
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
