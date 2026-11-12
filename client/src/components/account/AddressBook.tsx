import { FormEvent, useState } from "react";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { AddressInput, extraService } from "../../services/extra.service";
import { SavedAddress } from "../../types";
import Alert from "../common/Alert";

const empty: AddressInput = { label: "Ev", fullName: "", phone: "", line1: "", line2: "", city: "Bakı", postalCode: "", country: "Azərbaycan" };

const fields: { name: keyof AddressInput; label: string; wide?: boolean; optional?: boolean }[] = [
  { name: "label", label: "Ad (Ev, İş...)" },
  { name: "fullName", label: "Ad Soyad" },
  { name: "phone", label: "Telefon" },
  { name: "city", label: "Şəhər" },
  { name: "line1", label: "Ünvan", wide: true },
  { name: "line2", label: "Ünvan (əlavə)", wide: true, optional: true },
  { name: "postalCode", label: "Poçt indeksi" },
  { name: "country", label: "Ölkə" },
];

export default function AddressBook() {
  const list = useAsync(() => extraService.addresses(), []);
  const [form, setForm] = useState<AddressInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (address?: SavedAddress) => {
    setError(null);
    setEditingId(address?.id ?? null);
    setForm(address ? { ...address, line2: address.line2 ?? "" } : empty);
  };

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setForm(null);
      await list.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const { line2, ...rest } = form;
    const body = line2?.trim() ? form : rest;
    void run(() => (editingId ? extraService.updateAddress(editingId, body) : extraService.createAddress(body)));
  };

  return (
    <section className="card space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Ünvanlarım</h2>
        {!form && (
          <button type="button" className="btn-outline py-1.5 text-sm" onClick={() => open()}>
            + Yeni ünvan
          </button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}

      {form ? (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className={`space-y-1 ${field.wide ? "sm:col-span-2" : ""}`}>
              <span className="text-sm font-medium">{field.label}</span>
              <input
                className="input"
                required={!field.optional}
                value={String(form[field.name] ?? "")}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="accent-brand-600" checked={Boolean(form.isDefault)} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Əsas ünvan et
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saxlanılır..." : "Yadda saxla"}
            </button>
            <button type="button" className="btn-outline" onClick={() => setForm(null)}>
              Ləğv et
            </button>
          </div>
        </form>
      ) : list.data && list.data.length === 0 ? (
        <p className="text-sm text-muted">Hələ saxlanmış ünvan yoxdur. Sifariş zamanı “yadda saxla” seçsəniz, burada görünəcək.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.data?.map((address) => (
            <article key={address.id} className={`rounded-2xl border p-4 text-sm ${address.isDefault ? "border-brand-500" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{address.label}</p>
                {address.isDefault && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-500">Əsas</span>
                )}
              </div>
              <p className="mt-1 text-muted">
                {address.fullName} · {address.phone}
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}
              </p>
              <div className="mt-3 flex gap-3 text-xs font-medium">
                <button type="button" className="text-brand-600" onClick={() => open(address)}>
                  Redaktə
                </button>
                {!address.isDefault && (
                  <button type="button" className="text-ink/70" onClick={() => run(() => extraService.updateAddress(address.id, { isDefault: true }))}>
                    Əsas et
                  </button>
                )}
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() => window.confirm("Ünvan silinsin?") && run(() => extraService.deleteAddress(address.id))}
                >
                  Sil
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
