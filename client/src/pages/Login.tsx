import GoogleButton from "../components/auth/GoogleButton";
import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedIn = await login(email.trim(), password.trim());
      navigate(loggedIn.permissions.includes("dashboard:read") && from === "/" ? "/admin" : from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">Giriş</h1>
      {error && <Alert>{error}</Alert>}
      <label className="block space-y-1">
        <span className="text-sm font-medium">E-poçt və ya istifadəçi adı</span>
        <input className="input" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="flex items-center justify-between text-sm font-medium">
          Şifrə
          <Link to="/forgot-password" className="text-xs font-normal text-brand-600">
            Şifrəni unutmusunuz?
          </Link>
        </span>
        <div className="relative">
          <input className="input pr-20" type={showPassword ? "text" : "password"} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs font-medium text-slate-500 hover:text-brand-600">
            {showPassword ? "Gizlət" : "Göstər"}
          </button>
        </div>
      </label>
      <button className="btn-primary w-full" disabled={submitting} aria-busy={submitting || undefined}>
        {submitting && <span className="btn-spinner" aria-hidden="true" />}
        {submitting ? "Yoxlanılır..." : "Daxil ol"}
      </button>
      <GoogleButton />
      <p className="text-center text-sm text-ink/70">
        Hesabınız yoxdur?{" "}
        <Link to="/register" className="text-brand-600">
          Qeydiyyatdan keçin
        </Link>
      </p>
    </form>
  );
}
