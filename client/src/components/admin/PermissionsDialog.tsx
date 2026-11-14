import { Check, Lock, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/admin.service";
import { getErrorMessage } from "../../services/api";
import { AdminUser, Permission } from "../../types";
import { adminOnlyGrants, permissionGroups, rolePermissions } from "../../utils/permissions";
import Alert from "../common/Alert";

interface Props {
  user: AdminUser;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}

export default function PermissionsDialog({ user, onClose, onSaved }: Props) {
  const { user: me } = useAuth();
  const defaults = new Set<Permission>(rolePermissions[user.role]);
  const [granted, setGranted] = useState<Set<Permission>>(() => new Set(user.permissions ?? rolePermissions[user.role]));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdminTarget = user.role === "ADMIN";
  const actorIsAdmin = me?.role === "ADMIN";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const lockedReason = (key: Permission) => {
    if (isAdminTarget) return "Admin bütün icazələrə malikdir";
    if (!actorIsAdmin && !defaults.has(key) && (adminOnlyGrants.includes(key) || !me?.permissions.includes(key))) return "Bu icazəni yalnız admin verə bilər";
    return null;
  };

  const toggle = (key: Permission) => {
    setGranted((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const extra = [...granted].filter((key) => !defaults.has(key) && key !== "dashboard:read");
  const revoked = [...defaults].filter((key) => !granted.has(key));
  const hasStaffAccess = granted.size > 0;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await adminService.updatePermissions(user.id, { extraPermissions: extra, revokedPermissions: revoked });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`${user.name} icazələri`} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="animate-pop flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-5 text-brand-600" strokeWidth={1.8} aria-hidden="true" />
              İcazələr
            </p>
            <p className="truncate text-xs text-muted">{`${user.name} · ${user.email} · Rol: ${roleLabels[user.role]}`}</p>
          </div>
          <button type="button" className="flex size-9 items-center justify-center rounded-full hover:bg-chip" onClick={onClose} aria-label="Bağla">
            <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <p className="rounded-xl bg-chip/70 p-3 text-xs leading-relaxed text-muted">
            Rol əsas icazələri verir. Burada istifadəçiyə əlavə icazə verə və ya roldan gələn icazəni geri ala bilərsiniz. Dəyişiklik dərhal tətbiq olunur.
          </p>
          {permissionGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{group.title}</p>
              <ul className="space-y-1.5">
                {group.items.map((item) => {
                  const on = isAdminTarget || granted.has(item.key) || (item.key === "dashboard:read" && hasStaffAccess);
                  const reason = lockedReason(item.key);
                  const auto = item.key === "dashboard:read" && hasStaffAccess && !isAdminTarget;
                  const changed = !isAdminTarget && (defaults.has(item.key) ? !granted.has(item.key) : granted.has(item.key) && item.key !== "dashboard:read");
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        disabled={Boolean(reason) || auto}
                        onClick={() => toggle(item.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          on ? "border-brand-500/40 bg-brand-50/60 dark:bg-brand-500/10" : "border-line hover:bg-chip/60"
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                          {on && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                            {item.label}
                            {defaults.has(item.key) && !isAdminTarget && <span className="rounded-full bg-chip px-1.5 py-px text-[10px] font-normal text-muted">rol üzrə</span>}
                            {changed && <span className="rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-normal text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{defaults.has(item.key) ? "geri alınıb" : "əlavə"}</span>}
                            {auto && <span className="rounded-full bg-chip px-1.5 py-px text-[10px] font-normal text-muted">avtomatik</span>}
                          </span>
                          <span className="block text-xs text-muted">{reason ?? item.hint}</span>
                        </span>
                        {reason && <Lock className="size-4 shrink-0 text-muted" strokeWidth={1.8} aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {error && <Alert>{error}</Alert>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-xs text-muted">{hasStaffAccess || isAdminTarget ? "Admin panelə daxil ola biləcək" : "Yalnız müştəri imkanları"}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
              Ləğv et
            </button>
            <button type="button" className="btn-primary btn-sm" disabled={saving || isAdminTarget} onClick={() => void save()}>
              {saving ? "Saxlanılır..." : "Saxla"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
