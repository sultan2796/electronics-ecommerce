import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { productService } from "../../services/product.service";
import { Category } from "../../types";

const transliteration: Record<string, string> = { ə: "e", ı: "i", ö: "o", ü: "u", ş: "s", ç: "c", ğ: "g" };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[əıöüşçğ]/g, (char) => transliteration[char] ?? char)
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

function CategoryRow({ category, onChanged, onDeleted }: { category: Category; onChanged: (c: Category) => void; onDeleted: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const count = category._count?.products ?? 0;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onChanged({ ...category, ...(await adminService.updateCategory(category.id, { name: name.trim() })) });
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`"${category.name}" kateqoriyası silinsin?`)) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deleteCategory(category.id);
      onDeleted(category.id);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <li className="space-y-2 border-b border-chip px-5 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        {editing ? (
          <input className="input max-w-xs flex-1" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        ) : (
          <Link to={`/products?category=${category.slug}`} className="flex-1 font-medium hover:text-brand-600">
            {category.name}
          </Link>
        )}
        <span className="text-xs text-muted">/{category.slug}</span>
        <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs">{count} aktiv məhsul</span>
        {editing ? (
          <>
            <button type="button" className="btn-primary px-3 py-1.5" disabled={busy || name.trim().length < 2} onClick={save}>
              Saxla
            </button>
            <button type="button" className="btn-outline px-3 py-1.5" onClick={() => { setEditing(false); setName(category.name); }}>
              Ləğv
            </button>
          </>
        ) : (
          <>
            <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => setEditing(true)}>
              Adını dəyiş
            </button>
            <button type="button" className="text-xs text-red-600 hover:underline disabled:opacity-40" disabled={busy} onClick={remove}>
              Sil
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

export default function AdminCategories() {
  const categories = useAsync(() => productService.categories(), []);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await adminService.createCategory({ name: name.trim(), slug: slug.trim() });
      categories.setData((current) =>
        [...(current ?? []), { ...created, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setSlug("");
      setSlugTouched(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kateqoriyalar</h1>

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium">Ad</span>
          <input
            className="input"
            required
            minLength={2}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </label>
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium">Slug (URL)</span>
          <input
            className="input"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </label>
        <button className="btn-primary" disabled={saving}>
          {saving ? "Yaradılır..." : "+ Kateqoriya yarat"}
        </button>
        {error && <div className="w-full"><Alert>{error}</Alert></div>}
      </form>

      {categories.loading && !categories.data ? (
        <Spinner />
      ) : categories.error ? (
        <Alert>{categories.error}</Alert>
      ) : (
        <ul className="card">
          {categories.data?.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onChanged={(updated) => categories.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null)}
              onDeleted={(id) => categories.setData((current) => current?.filter((item) => item.id !== id) ?? null)}
            />
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">İçində məhsul olan kateqoriya silinə bilməz: əvvəlcə məhsulları başqa kateqoriyaya keçirin.</p>
    </div>
  );
}
