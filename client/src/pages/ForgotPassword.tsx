import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/common/Alert";
import { getErrorMessage } from "../services/api";
import { authService } from "../services/auth.service";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await authService.forgotPassword(email);
      setSent(result.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">Şifrəni unutmusunuz?</h1>
      {sent ? (
        <>
          <Alert variant="success">{sent}</Alert>
          <p className="text-sm text-muted">Məktub gəlmirsə, spam qovluğunu yoxlayın. Link məhdud müddət etibarlıdır.</p>
          <Link to="/login" className="btn-primary w-full">
            Girişə qayıt
          </Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">E-poçt ünvanınızı yazın, şifrəni yeniləmək üçün sizə link göndərək.</p>
          {error && <Alert>{error}</Alert>}
          <label className="block space-y-1">
            <span className="text-sm font-medium">E-poçt</span>
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Göndərilir..." : "Link göndər"}
          </button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-brand-600">
              Girişə qayıt
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
