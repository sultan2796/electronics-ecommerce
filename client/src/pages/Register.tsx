import GoogleButton from "../components/auth/GoogleButton";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">Qeydiyyat</h1>
      {error && <Alert>{error}</Alert>}
      <label className="block space-y-1">
        <span className="text-sm font-medium">Ad Soyad</span>
        <input className="input" required minLength={2} value={form.name} onChange={(e) => update("name")(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">E-poçt</span>
        <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => update("email")(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Şifrə (ən az 8 simvol)</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => update("password")(e.target.value)}
        />
      </label>
      <button className="btn-primary w-full" disabled={submitting} aria-busy={submitting || undefined}>
        {submitting && <span className="btn-spinner" aria-hidden="true" />}
        {submitting ? "Yaradılır..." : "Hesab yarat"}
      </button>
      <GoogleButton />
      <p className="text-center text-sm text-ink/70">
        Artıq hesabınız var?{" "}
        <Link to="/login" className="text-brand-600">
          Daxil olun
        </Link>
      </p>
    </form>
  );
}
