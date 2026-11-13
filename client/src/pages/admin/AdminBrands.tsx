import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import { confirmDialog } from "../../components/common/Overlays";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { adminService } from "../../services/admin.service";
import { getErrorMessage } from "../../services/api";
import { Brand } from "../../types";

function BrandRow({ brand, onChanged, onDeleted }: { brand: Brand; onChanged: (b: Brand) => void; onDeleted: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const count = brand._count?.products ?? 0;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      const updated = await adminService.updateBrand(brand.id, { name: name.trim(), logoUrl: logoUrl.trim() || null });
      onChanged({ ...brand, ...updated });
      setEditing(false);
    });

  const toggle = () =>
    run(async () => {
      const updated = await adminService.updateBrand(brand.id, { isActive: !brand.isActive });
      onChanged({ ...brand, ...updated });
    });

  const remove = async () => {
    if (!(await confirmDialog(`"${brand.name}" brendi silinsin?`, { confirmLabel: "Sil" }))) return;
    await run(async () => {
      await adminService.deleteBrand(brand.id);
      onDeleted(brand.id);
    });
  };

  return (
    <li className="space-y-2 border-b border-chip px-5 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt="" className="h-8 w-8 rounded-lg bg-white object-contain p-1" loading="lazy" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chip text-xs font-bold">{brand.name.slice(0, 2).toUpperCase()}</span>
        )}
        {editing ? (
          <div className="flex flex-1 flex-wrap gap-2">
            <input className="input max-w-xs flex-1" value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="Ad" />
            <input className="input max-w-sm flex-1" value={logoUrl} placeholder="Loqo URL (https://...)" onChange={(e) => setLogoUrl(e.target.value)} aria-label="Loqo URL" />
          </div>
        ) : (
          <Link to={`/products?brand=${encodeURIComponent(brand.name)}`} className="flex-1 font-medium hover:text-brand-600">
            {brand.name}
          </Link>
        )}
        <span className="text-xs text-muted">/{brand.slug}</span>
        <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs">{`${count} aktiv məhsul`}</span>
        {!brand.isActive && <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs text-warning">Deaktiv</span>}
        {editing ? (
          <>
            <button type="button" className="btn-primary btn-sm" disabled={busy || !name.trim()} onClick={save}>
              Saxla
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={() => { setEditing(false); setName(brand.name); setLogoUrl(brand.logoUrl ?? ""); }}>
              Ləğv
            </button>
          </>
        ) : (
          <>
            <button type="button" className="text-xs text-brand-600" onClick={() => setEditing(true)}>
              Redaktə
            </button>
            <button type="button" className="text-xs text-brand-600 disabled:opacity-40" disabled={busy} onClick={toggle}>
              {brand.isActive ? "Deaktiv et" : "Aktiv et"}
            </button>
            <button type="button" className="text-xs text-red-600 disabled:opacity-40" disabled={busy} onClick={remove}>
              Sil
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

export default function AdminBrands() {
  const brands = useAsync(() => adminService.brands(true), []);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await adminService.createBrand({ name: name.trim(), logoUrl: logoUrl.trim() || null });
      brands.setData((current) => [...(current ?? []), { ...created, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setLogoUrl("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brendlər</h1>

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium">Ad</span>
          <input className="input" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium">Loqo URL (istəyə bağlı)</span>
          <input className="input" type="url" placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </label>
        <button className="btn-primary" disabled={saving}>
          {saving ? "Yaradılır..." : "+ Brend yarat"}
        </button>
        {error && <div className="w-full"><Alert>{error}</Alert></div>}
      </form>

      {brands.loading && !brands.data ? (
        <Spinner />
      ) : brands.error ? (
        <Alert>{brands.error}</Alert>
      ) : brands.data?.length ? (
        <ul className="card">
          {brands.data.map((brand) => (
            <BrandRow
              key={brand.id}
              brand={brand}
              onChanged={(updated) => brands.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null)}
              onDeleted={(id) => brands.setData((current) => current?.filter((item) => item.id !== id) ?? null)}
            />
          ))}
        </ul>
      ) : (
        <p className="card p-5 text-sm text-muted">Hələ brend yoxdur.</p>
      )}
      <p className="text-xs text-muted">Brendin adını dəyişəndə ona bağlı bütün məhsullarda ad yenilənir. Məhsulu olan brend silinə bilməz, onu deaktiv edə bilərsiniz.</p>
    </div>
  );
}
