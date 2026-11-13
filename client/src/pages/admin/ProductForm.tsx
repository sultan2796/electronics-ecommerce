import Select from "../../components/common/Select";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import ProductImage from "../../components/product/ProductImage";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { productService } from "../../services/product.service";
import { Product, ProductPayload, StorageType } from "../../types";
import { extraService, fileToDataUrl } from "../../services/extra.service";
import ModelManager from "../../components/admin/ModelManager";

const storageTypes: StorageType[] = ["SSD", "NVME", "HDD", "EMMC", "UFS"];

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

interface FormState {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string;
  price: string;
  salePrice: string;
  model3dUrl: string;
  model3dActive: boolean;
  model3dSize: number | null;
  model3dLicense: string;
  model3dSource: string;
  stock: string;
  images: string;
  categoryId: string;
  isActive: boolean;
  cpu: string;
  gpu: string;
  ramGb: string;
  storageGb: string;
  storageType: string;
  screenSizeInch: string;
  resolution: string;
  refreshRateHz: string;
  batteryMah: string;
  os: string;
  weightGrams: string;
  connectivity: string;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  sku: "",
  brand: "",
  description: "",
  price: "",
  salePrice: "",
  model3dUrl: "",
  model3dActive: true,
  model3dSize: null,
  model3dLicense: "",
  model3dSource: "",
  stock: "0",
  images: "",
  categoryId: "",
  isActive: true,
  cpu: "",
  gpu: "",
  ramGb: "",
  storageGb: "",
  storageType: "",
  screenSizeInch: "",
  resolution: "",
  refreshRateHz: "",
  batteryMah: "",
  os: "",
  weightGrams: "",
  connectivity: "",
};

const toText = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));

const fromProduct = (product: Product): FormState => ({
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  brand: product.brand,
  description: product.description,
  price: String(Number(product.price)),
  salePrice: product.salePrice ? String(Number(product.salePrice)) : "",
  model3dUrl: product.model3dUrl ?? "",
  model3dActive: product.model3dActive ?? true,
  model3dSize: product.model3dSize ?? null,
  model3dLicense: product.model3dLicense ?? "",
  model3dSource: product.model3dSource ?? "",
  stock: String(product.stock),
  images: product.images.join("\n"),
  categoryId: product.categoryId,
  isActive: product.isActive,
  cpu: toText(product.specs?.cpu),
  gpu: toText(product.specs?.gpu),
  ramGb: toText(product.specs?.ramGb),
  storageGb: toText(product.specs?.storageGb),
  storageType: toText(product.specs?.storageType),
  screenSizeInch: product.specs?.screenSizeInch ? String(Number(product.specs.screenSizeInch)) : "",
  resolution: toText(product.specs?.resolution),
  refreshRateHz: toText(product.specs?.refreshRateHz),
  batteryMah: toText(product.specs?.batteryMah),
  os: toText(product.specs?.os),
  weightGrams: toText(product.specs?.weightGrams),
  connectivity: product.specs?.connectivity.join(", ") ?? "",
});

const optionalText = (value: string) => value.trim() || undefined;
const optionalInt = (value: string) => (value.trim() ? Math.round(Number(value)) : undefined);
const optionalNumber = (value: string) => (value.trim() ? Number(value) : undefined);

const toPayload = (form: FormState): ProductPayload => ({
  name: form.name.trim(),
  slug: form.slug.trim(),
  sku: form.sku.trim(),
  brand: form.brand.trim(),
  description: form.description.trim(),
  price: Number(form.price),
  salePrice: form.salePrice.trim() ? Number(form.salePrice) : null,
  model3dUrl: form.model3dUrl.trim() || null,
  model3dActive: form.model3dActive,
  model3dSize: form.model3dUrl.trim() ? form.model3dSize : null,
  model3dLicense: form.model3dUrl.trim() ? form.model3dLicense.trim() || null : null,
  model3dSource: form.model3dUrl.trim() ? form.model3dSource.trim() || null : null,
  stock: Math.round(Number(form.stock)),
  images: form.images.split("\n").map((line) => line.trim()).filter(Boolean),
  categoryId: form.categoryId,
  isActive: form.isActive,
  specs: {
    cpu: optionalText(form.cpu),
    gpu: optionalText(form.gpu),
    ramGb: optionalInt(form.ramGb),
    storageGb: optionalInt(form.storageGb),
    storageType: (optionalText(form.storageType) as StorageType | undefined) ?? undefined,
    screenSizeInch: optionalNumber(form.screenSizeInch),
    resolution: optionalText(form.resolution),
    refreshRateHz: optionalInt(form.refreshRateHz),
    batteryMah: optionalInt(form.batteryMah),
    os: optionalText(form.os),
    weightGrams: optionalInt(form.weightGrams),
    connectivity: form.connectivity.split(",").map((item) => item.trim()).filter(Boolean),
  },
});

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const categories = useAsync(() => productService.categories(), []);
  const existing = useAsync(() => (id ? adminService.getProduct(id) : Promise.resolve(null)), [id]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (existing.data) {
      setForm(fromProduct(existing.data));
      setSlugTouched(true);
    }
  }, [existing.data]);

  useEffect(() => {
    if (!isEdit && !form.categoryId && categories.data?.length) {
      setForm((current) => ({ ...current, categoryId: categories.data?.[0]?.id ?? "" }));
    }
  }, [categories.data, form.categoryId, isEdit]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  };

  const input = (key: keyof FormState, props: { type?: string; placeholder?: string; step?: string; required?: boolean } = {}) => (
    <input
      className="input rounded-xl"
      type={props.type ?? "text"}
      step={props.step}
      placeholder={props.placeholder}
      required={props.required}
      value={String(form[key])}
      onChange={(event) => update(key, event.target.value as never)}
    />
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (id) {
        await adminService.updateProduct(id, payload);
        setSaved(true);
        existing.reload();
      } else {
        const created = await adminService.createProduct(payload);
        navigate(`/admin/products/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if ((isEdit && existing.loading && !existing.data) || categories.loading) return <Spinner />;
  if (isEdit && existing.error) return <Alert>{existing.error}</Alert>;

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 2 * 1024 * 1024) throw new Error(`${file.name} 2 MB-dan böyükdür`);
        urls.push((await extraService.upload(await fileToDataUrl(file))).url);
      }
      update("images", [form.images.trim(), ...urls].filter(Boolean).join("\n"));
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const previewImage = form.images.split("\n").map((line) => line.trim()).find(Boolean);
  const category = categories.data?.find((item) => item.id === form.categoryId);

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/inventory" className="text-xs text-muted hover:text-brand-600">
            ← Anbara qayıt
          </Link>
          <h1 className="text-2xl font-bold">{isEdit ? "Məhsulu redaktə et" : "Yeni məhsul"}</h1>
        </div>
        <div className="flex gap-2">
          {isEdit && existing.data?.isActive && (
            <Link to={`/products/${existing.data.slug}`} className="btn-outline">
              Saytda bax
            </Link>
          )}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Yadda saxlanılır..." : isEdit ? "Dəyişiklikləri saxla" : "Məhsulu yarat"}
          </button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {saved && <Alert variant="success">Dəyişikliklər yadda saxlanıldı.</Alert>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Əsas məlumatlar</h2>
            <Field label="Ad *" wide>
              {input("name", { required: true })}
            </Field>
            <Field label="Slug (URL) *">
              <input
                className="input rounded-xl"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  update("slug", event.target.value);
                }}
              />
            </Field>
            <Field label="SKU *">{input("sku", { required: true })}</Field>
            <Field label="Brend *">{input("brand", { required: true })}</Field>
            <Field label="Kateqoriya *">
              <Select
                ariaLabel="Kateqoriya"
                placeholder="Kateqoriya seçin"
                value={form.categoryId}
                onChange={(categoryId) => update("categoryId", categoryId)}
                options={(categories.data ?? []).map((item) => ({ value: item.id, label: item.name }))}
              />
            </Field>
            <Field label="Qiymət (AZN) *">{input("price", { type: "number", step: "0.01", required: true })}</Field>
            <Field label="Endirimli qiymət (AZN)">{input("salePrice", { type: "number", step: "0.01" })}</Field>
            <Field label="Stok *">{input("stock", { type: "number", step: "1", required: true })}</Field>
            <Field label="Təsvir" wide>
              <textarea
                className="input min-h-[120px] rounded-xl"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </Field>
          </section>

          <ModelManager
            alt={form.name || "3D model"}
            value={{
              model3dUrl: form.model3dUrl,
              model3dActive: form.model3dActive,
              model3dSize: form.model3dSize,
              model3dLicense: form.model3dLicense,
              model3dSource: form.model3dSource,
            }}
            onChange={(next) => setForm((current) => ({ ...current, ...next }))}
          />

          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Texniki göstəricilər</h2>
            <Field label="Prosessor (CPU)">{input("cpu")}</Field>
            <Field label="Qrafik (GPU)">{input("gpu")}</Field>
            <Field label="RAM (GB)">{input("ramGb", { type: "number" })}</Field>
            <Field label="Daxili yaddaş (GB)">{input("storageGb", { type: "number" })}</Field>
            <Field label="Yaddaş növü">
              <Select
                ariaLabel="Yaddaş növü"
                value={form.storageType}
                onChange={(storageType) => update("storageType", storageType)}
                options={[{ value: "", label: "—" }, ...storageTypes.map((type) => ({ value: type, label: type }))]}
              />
            </Field>
            <Field label="Ekran (düym)">{input("screenSizeInch", { type: "number", step: "0.1" })}</Field>
            <Field label="Ölçü (piksel)">{input("resolution", { placeholder: "1920x1080" })}</Field>
            <Field label="Yenilənmə tezliyi (Hz)">{input("refreshRateHz", { type: "number" })}</Field>
            <Field label="Batareya (mAh)">{input("batteryMah", { type: "number" })}</Field>
            <Field label="Əməliyyat sistemi">{input("os")}</Field>
            <Field label="Çəki (q)">{input("weightGrams", { type: "number" })}</Field>
            <Field label="Bağlantı (vergüllə)">{input("connectivity", { placeholder: "Wi-Fi 6, Bluetooth 5.3" })}</Field>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="font-semibold">Şəkillər</h2>
            <div className="flex aspect-square items-center justify-center rounded-[20px] bg-chip">
              <ProductImage src={previewImage} category={category?.slug} alt={form.name || "Önizləmə"} className="size-[80%]" />
            </div>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="sr-only" onChange={(event) => void uploadFiles(event.target.files)} />
              {uploading ? "Yüklənir..." : "Kompüterdən şəkil yüklə (maks. 2 MB)"}
            </label>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            <Field label="Şəkil linkləri (hər sətirdə bir)">
              <textarea
                className="input min-h-[100px] rounded-xl font-mono text-xs"
                placeholder="https://..."
                value={form.images}
                onChange={(event) => update("images", event.target.value)}
              />
            </Field>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">Status</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} />
              Satışdadır (saytda görünür)
            </label>
          </section>
        </div>
      </div>
    </form>
  );
}
