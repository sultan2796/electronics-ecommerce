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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedIn = await login(email, password);
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
        <span className="text-sm font-medium">E-poçt</span>
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="flex items-center justify-between text-sm font-medium">
          Şifrə
          <Link to="/forgot-password" className="text-xs font-normal text-brand-600">
            Şifrəni unutmusunuz?
          </Link>
        </span>
        <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button className="btn-primary w-full" disabled={submitting}>
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
