import { Component, ErrorInfo, ReactNode } from "react";
import { reportError } from "../../utils/errorReporter";

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Gözlənilməz xəta", error, info.componentStack);
    reportError(error.message, `${error.stack ?? ""}\n${info.componentStack ?? ""}`);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink">
        <div className="card w-full max-w-md space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-bold">Gözlənilməz xəta baş verdi</h1>
          <p className="text-sm text-muted">Səhifəni yeniləyin. Problem təkrarlanarsa, bizimlə əlaqə saxlayın.</p>
          <details className="rounded-lg bg-chip p-3 text-left text-xs text-muted">
            <summary className="cursor-pointer font-medium">Texniki məlumat</summary>
            <p className="mt-2 break-words font-mono">{this.state.error.message}</p>
          </details>
          <div className="flex justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Səhifəni yenilə
            </button>
            <a href="/" className="btn-outline">
              Ana səhifə
            </a>
          </div>
        </div>
      </div>
    );
  }
}
