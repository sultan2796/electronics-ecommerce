import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let loader: Promise<void> | null = null;
const loadScript = () => {
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google skripti yüklənmədi"));
      document.head.appendChild(script);
    });
  }
  return loader;
};

export default function GoogleButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            try {
              setError(null);
              await googleLogin(credential);
              navigate(redirectTo, { replace: true });
            } catch (err) {
              setError(getErrorMessage(err));
            }
          },
        });
        window.google.accounts.id.renderButton(container.current, { theme: "outline", size: "large", shape: "pill", width: 320, text: "continue_with", locale: "az" });
      })
      .catch((err: Error) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [googleLogin, navigate, redirectTo]);

  if (!clientId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        və ya
        <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={container} className="flex min-h-[44px] justify-center" />
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
