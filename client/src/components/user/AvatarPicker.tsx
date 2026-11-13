import { Camera, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { avatarAccept, prepareAvatar } from "../../utils/avatarImage";
import Avatar from "./Avatar";

interface Props {
  name: string;
  src: string | null;
  busy?: boolean;
  onPick: (dataUrl: string) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  size?: string;
}

export default function AvatarPicker({ name, src, busy = false, onPick, onRemove, size = "size-20 text-2xl" }: Props) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const disabled = busy || working;

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setWorking(true);
    try {
      await onPick(await prepareAvatar(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şəkil yüklənmədi");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar name={name || "?"} src={src} className={size} />
        {disabled && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"><span className="btn-spinner" aria-hidden="true" /></span>}
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <label htmlFor={inputId} className={`btn-outline btn-sm cursor-pointer ${disabled ? "pointer-events-none opacity-60" : ""}`}>
            <Camera className="size-4" strokeWidth={1.8} aria-hidden="true" />
            {src ? "Şəkli dəyiş" : "Şəkil əlavə et"}
          </label>
          <input
            id={inputId}
            type="file"
            accept={avatarAccept}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              void choose(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {src && onRemove && (
            <button type="button" className="btn-ghost btn-sm text-red-600" disabled={disabled} onClick={() => void onRemove()}>
              <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Sil
            </button>
          )}
        </div>
        <p className="text-xs text-muted">PNG, JPG və ya WEBP. Şəkil kvadrat kəsilib kiçildilir.</p>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      </div>
    </div>
  );
}
