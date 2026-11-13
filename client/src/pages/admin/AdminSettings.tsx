import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import { toast } from "../../components/common/Overlays";
import BrandMark from "../../components/brand/BrandMark";
import Logo from "../../components/brand/Logo";
import Button from "../../components/ui/Button";
import { SiteSettings, SiteSettingsPreview, useSiteSettings } from "../../context/SiteSettingsContext";
import { api, getErrorMessage } from "../../services/api";
import { extraService, fileToDataUrl } from "../../services/extra.service";

type AssetKey = keyof SiteSettings;

const assets: { key: AssetKey; title: string; hint: string }[] = [
  { key: "logoUrl", title: "Tam loqo", hint: "Ad və nişan birlikdə. Şəffaf fonlu PNG və ya WEBP, hündürlüyü ən azı 72px. Yüklənsə, başlıqda və footer-də yalnız bu şəkil göstərilir." },
  { key: "logoIconUrl", title: "Loqo ikonu", hint: "Kvadrat nişan, ən azı 128×128px. Yazının yanında göstərilir." },
  { key: "faviconUrl", title: "Favicon", hint: "Brauzer tabında görünən kvadrat ikon, ən azı 64×64px." },
];

const MAX = 2 * 1024 * 1024;

export default function AdminSettings() {
  const { settings, setSettings } = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [busy, setBusy] = useState<AssetKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Partial<Record<AssetKey, string>>>({});
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  useEffect(() => setDraft(settings), [settings]);

  const upload = async (key: AssetKey, file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("Yalnız PNG, JPG və ya WEBP şəkil yükləyin");
    if (file.size > MAX) return setError("Şəkil 2 MB-dan böyük olmamalıdır");
    setBusy(key);
    try {
      const { url } = await extraService.upload(await fileToDataUrl(file));
      setDraft((current) => ({ ...current, [key]: url }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.put<SiteSettings>("/admin/settings", draft);
      setSettings(data);
      setDraft(data);
      toast("Parametrlər saxlanıldı və bütün saytda tətbiq olundu");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Parametrlər</h1>
          <p className="text-sm text-muted">Loqo, ikon və favicon. Dəyişikliklər saxlandıqdan sonra bütün saytda tətbiq olunur.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!dirty || saving} onClick={() => setDraft(settings)}>
            Ləğv et
          </Button>
          <Button loading={saving} loadingText="Saxlanılır..." disabled={!dirty} onClick={() => void save()}>
            Dəyişiklikləri saxla
          </Button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Önizləmə</h2>
        <SettingsPreview draft={draft} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {assets.map((asset) => {
          const value = draft[asset.key];
          return (
            <section key={asset.key} className="card flex flex-col gap-3 p-5">
              <div>
                <h2 className="font-semibold">{asset.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">{asset.hint}</p>
              </div>
              <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-line bg-[repeating-conic-gradient(rgb(var(--chip))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4">
                {value ? (
                  <img
                    src={value}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    onLoad={(event) =>
                      setDimensions((current) => ({ ...current, [asset.key]: `${event.currentTarget.naturalWidth}×${event.currentTarget.naturalHeight}px` }))
                    }
                  />
                ) : asset.key === "logoUrl" ? (
                  <span className="text-xs text-muted">Standart loqo istifadə olunur</span>
                ) : (
                  <BrandMark className="size-14" />
                )}
              </div>
              {value && dimensions[asset.key] && <p className="text-xs text-muted">{`Ölçü: ${dimensions[asset.key]}`}</p>}
              <div className="mt-auto flex flex-wrap gap-2">
                <label className={`btn-outline btn-sm cursor-pointer ${busy === asset.key ? "pointer-events-none opacity-60" : ""}`}>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void upload(asset.key, event.target.files?.[0])} />
                  {busy === asset.key ? "Yüklənir..." : value ? "Dəyiş" : "Yüklə"}
                </label>
                {value && (
                  <Button variant="ghost" size="sm" onClick={() => setDraft((current) => ({ ...current, [asset.key]: null }))}>
                    Standarta qaytar
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SettingsPreview({ draft }: { draft: SiteSettings }) {
  return (
    <SiteSettingsPreview value={draft}>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex h-20 items-center rounded-2xl border border-line bg-white px-5">
          <Logo />
        </div>
        <div className="flex h-20 items-center rounded-2xl bg-[#0f172a] px-5">
          <Logo tone="inverse" />
        </div>
        <div className="flex h-20 items-center gap-3 rounded-2xl border border-line bg-surface px-5">
          <Logo size="sm" />
          <span className="ml-auto flex items-center gap-2 rounded-lg bg-chip px-2 py-1 text-xs text-muted">
            {draft.faviconUrl ? <img src={draft.faviconUrl} alt="" className="size-4 object-contain" /> : <BrandMark className="size-4" />}
            ElectroShop
          </span>
        </div>
      </div>
    </SiteSettingsPreview>
  );
}
