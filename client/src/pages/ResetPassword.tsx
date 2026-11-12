import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import { getErrorMessage } from "../services/api";
import { authService } from "../services/auth.service";
import { passwordProblems } from "../utils/password";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token.length < 32) {
      setValid(false);
      return;
    }
    authService
      .validateResetToken(token)
      .then(setValid)
      .catch(() => setValid(false));
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problems = passwordProblems(password);
    if (problems.length) {
      setError(`Şifrə ${problems.join(", ")}`);
      return;
    }
    if (password !== confirm) {
      setError("Şifrələr eyni deyil");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await authService.resetPassword(token, password);
      setDone(result.message);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (valid === null) return <Spinner />;

  return (
    <div className="card mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">Yeni şifrə</h1>
      {!valid ? (
        <>
          <Alert>Link etibarsızdır və ya vaxtı bitib.</Alert>
          <Link to="/forgot-password" className="btn-primary w-full">
            Yeni link istə
          </Link>
        </>
      ) : done ? (
        <Alert variant="success">{done}</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <label className="block space-y-1">
            <span className="text-sm font-medium">Yeni şifrə</span>
            <input className="input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Şifrəni təkrarlayın</span>
            <input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <p className="text-xs text-muted">Ən az 8 simvol. Güclü şifrə üçün böyük-kiçik hərf, rəqəm və simvol qarışdırın.</p>
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Yadda saxlanılır..." : "Şifrəni yenilə"}
          </button>
        </form>
      )}
    </div>
  );
}
