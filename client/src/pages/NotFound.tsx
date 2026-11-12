import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      title="Axtardığınız səhifə tapılmadı."
      action={
        <Link to="/" className="btn-primary">
          Ana səhifə
        </Link>
      }
    />
  );
}
