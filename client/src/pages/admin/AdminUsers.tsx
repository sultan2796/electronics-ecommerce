import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import Spinner from "../../components/common/Spinner";
import { roleLabels, useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../services/api";
import { adminService } from "../../services/admin.service";
import { AdminUser, Role } from "../../types";
import { formatDate } from "../../utils/format";

const roles: Role[] = ["ADMIN", "MANAGER", "SUPPORT", "CUSTOMER"];

const roleStyles: Record<Role, string> = {
  ADMIN: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-500",
  MANAGER: "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  SUPPORT: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
  CUSTOMER: "bg-chip text-ink/70",
};

const roleDescriptions: Record<Role, string> = {
  ADMIN: "Hər şeyə tam giriş, istifadəçilərin rollarını idarə edir",
  MANAGER: "Məhsullar, anbar, kateqoriyalar, idxal; sifarişlərə yalnız baxır",
  SUPPORT: "Sifarişlərin statusunu idarə edir, istifadəçilərə baxır",
  CUSTOMER: "Yalnız alış-veriş, admin panelə girişi yoxdur",
};

export default function AdminUsers() {
  const { user: me, can } = useAuth();
  const canEdit = can("users:write");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const roleParam = params.get("role") as Role | null;
  const role = roleParam && roles.includes(roleParam) ? roleParam : undefined;
  const page = Number(params.get("page")) || 1;
  const [search, setSearch] = useState(q);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const users = useAsync(() => adminService.users({ q: q || undefined, role, page }), [q, role, page]);

  const setQuery = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => (value ? merged.set(key, value) : merged.delete(key)));
    setParams(merged);
  };

  const change = async (target: AdminUser, body: { role?: Role; isBlocked?: boolean }) => {
    setError(null);
    setBusyId(target.id);
    try {
      const updated = await adminService.updateUser(target.id, body);
      users.setData((current) =>
        current ? { ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) } : current,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ q: search.trim(), page: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">İstifadəçilər</h1>
        <form onSubmit={onSearch} className="flex gap-2">
          <input className="input w-64" placeholder="Ad və ya e-poçt" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-outline">Axtar</button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setQuery({ role: role === value ? "" : value, page: "" })}
            className={`card p-4 text-left transition ${role === value ? "ring-2 ring-brand-500" : "hover:shadow-md"}`}
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[value]}`}>{roleLabels[value]}</span>
              <span className="text-lg font-bold">{users.data?.roleCounts[value] ?? 0}</span>
            </div>
            <p className="mt-2 text-xs text-muted">{roleDescriptions[value]}</p>
          </button>
        ))}
      </div>

      {!canEdit && <Alert variant="info">Rolunuz istifadəçilərə yalnız baxmağa icazə verir.</Alert>}
      {error && <Alert>{error}</Alert>}

      {users.loading && !users.data ? (
        <Spinner />
      ) : users.error ? (
        <Alert>{users.error}</Alert>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr className="border-b border-chip">
                  <th className="px-4 py-3">İstifadəçi</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Sifariş</th>
                  <th className="px-4 py-3">Qeydiyyat</th>
                  <th className="px-4 py-3">Son giriş</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.data?.items.map((item) => {
                  const isMe = item.id === me?.id;
                  const disabled = !canEdit || isMe || busyId === item.id;
                  return (
                    <tr key={item.id} className={`border-b border-chip last:border-0 ${item.isBlocked ? "bg-red-50/60 dark:bg-red-500/10" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {item.name} {isMe && <span className="text-xs text-muted">(siz)</span>}
                        </p>
                        <p className="text-xs text-muted">{item.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {disabled ? (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[item.role]}`}>{roleLabels[item.role]}</span>
                        ) : (
                          <select
                            className="input w-auto py-1.5"
                            value={item.role}
                            onChange={(e) => change(item, { role: e.target.value as Role })}
                          >
                            {roles.map((value) => (
                              <option key={value} value={value}>
                                {roleLabels[value]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">{item._count.orders}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 text-muted">{item.lastLoginAt ? formatDate(item.lastLoginAt) : "—"}</td>
                      <td className="px-4 py-3">
                        {disabled ? (
                          <span className={`text-xs font-medium ${item.isBlocked ? "text-red-600" : "text-emerald-600"}`}>
                            {item.isBlocked ? "Bloklanıb" : "Aktiv"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => change(item, { isBlocked: !item.isBlocked })}
                            className={`text-xs font-medium hover:underline ${item.isBlocked ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {item.isBlocked ? "Bloku aç" : "Blokla"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!users.data?.items.length && <p className="px-5 py-6 text-sm text-muted">İstifadəçi tapılmadı.</p>}
          </div>
          {users.data && (
            <Pagination page={users.data.page} totalPages={users.data.totalPages} onChange={(next) => setQuery({ page: String(next) })} />
          )}
        </>
      )}
    </div>
  );
}
