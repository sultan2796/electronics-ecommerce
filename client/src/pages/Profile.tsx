import GoogleButton from "../components/auth/GoogleButton";
import AvatarPicker from "../components/user/AvatarPicker";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Alert from "../components/common/Alert";
import { roleLabels, useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import AddressBook from "../components/account/AddressBook";

export default function Profile() {
  const { user, updateProfile, changePassword, isStaff, logout, reloadUser, setAvatar } = useAuth();
  const avatarFailed = Boolean((useLocation().state as { avatarFailed?: boolean } | null)?.avatarFailed);

  useEffect(() => {
    void reloadUser();
  }, [reloadUser]);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [profileMessage, setProfileMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile(name.trim());
      setProfileMessage({ ok: true, text: "Məlumatlar yeniləndi." });
    } catch (err) {
      setProfileMessage({ ok: false, text: getErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordMessage({ ok: false, text: "Yeni şifrələr eyni deyil." });
      return;
    }
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordMessage({ ok: true, text: "Şifrə dəyişdirildi. Digər cihazlardakı sessiyalar bağlandı." });
    } catch (err) {
      setPasswordMessage({ ok: false, text: getErrorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex flex-wrap items-center gap-4 p-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          {avatarFailed && <p className="text-xs text-red-600">Hesab yaradıldı, amma profil şəkli yüklənmədi. Yenidən cəhd edin.</p>}
          <AvatarPicker
            name={user.name}
            src={user.avatarUrl ?? null}
            onPick={async (dataUrl) => {
              await setAvatar(dataUrl);
            }}
            onRemove={async () => {
              await setAvatar(null);
            }}
            size="size-16 text-xl"
          />
        </div>
        <button type="button" className="btn-outline order-last px-4 py-1.5 sm:order-none" onClick={() => logout().then(() => navigate("/"))}>
          Çıxış
        </button>
        <span className="rounded-full bg-brand-50 dark:bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-500">{roleLabels[user.role]}</span>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-6 dark:from-amber-500/10 dark:to-orange-500/10">
        <div>
          <p className="text-sm text-muted">Bonus balansınız</p>
          <p className="text-3xl font-bold text-ink">
            {user.points ?? 0} <span className="text-base font-medium text-muted">bal ≈ {((user.points ?? 0) * 0.01).toFixed(2)} ₼</span>
          </p>
        </div>
        <p className="max-w-sm text-sm text-muted">Hər 1 ₼ alışa 1 bal qazanırsınız (sifariş çatdırılanda). Ödəniş zamanı ballarla sifarişin 50%-nə qədərini ödəyə bilərsiniz.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/orders" className="card p-4 text-sm font-medium hover:text-brand-600">Sifarişlərim →</Link>
        <Link to="/wishlist" className="card p-4 text-sm font-medium hover:text-brand-600">İstək siyahısı →</Link>
        {isStaff ? (
          <Link to="/admin" className="card p-4 text-sm font-medium hover:text-brand-600">Admin panel →</Link>
        ) : (
          <Link to="/cart" className="card p-4 text-sm font-medium hover:text-brand-600">Səbət →</Link>
        )}
      </div>

      {import.meta.env.VITE_GOOGLE_CLIENT_ID && !user.googleLinked && (
        <section className="card space-y-3 p-6">
          <h2 className="font-semibold">Google ilə giriş</h2>
          <p className="text-sm text-muted">Google hesabınızı bağlasanız, növbəti dəfə şifrəsiz daxil ola bilərsiniz.</p>
          <GoogleButton mode="link" />
        </section>
      )}

      <form onSubmit={saveProfile} className="card space-y-4 p-6">
        <h2 className="font-semibold">Şəxsi məlumatlar</h2>
        {profileMessage && <Alert variant={profileMessage.ok ? "success" : "error"}>{profileMessage.text}</Alert>}
        <label className="block space-y-1">
          <span className="text-sm font-medium">Ad Soyad</span>
          <input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">E-poçt</span>
          <input className="input bg-chip" value={user.email} disabled />
        </label>
        <button className="btn-primary" disabled={savingProfile || name.trim() === user.name}>
          {savingProfile ? "Saxlanılır..." : "Yadda saxla"}
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4 p-6">
        <h2 className="font-semibold">Şifrəni dəyiş</h2>
        {passwordMessage && <Alert variant={passwordMessage.ok ? "success" : "error"}>{passwordMessage.text}</Alert>}
        <label className="block space-y-1">
          <span className="text-sm font-medium">Hazırkı şifrə</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Yeni şifrə (ən az 8 simvol)</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Yeni şifrə (təkrar)</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            />
          </label>
        </div>
        <button className="btn-primary" disabled={savingPassword}>
          {savingPassword ? "Dəyişdirilir..." : "Şifrəni dəyiş"}
        </button>
      </form>

      <AddressBook />
    </div>
  );
}
