import { Component, ErrorInfo, ReactNode } from "react";

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
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink">
        <div className="card max-w-md space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold">Gözlənilməz xəta baş verdi</h1>
          <p className="text-sm text-muted">Səhifəni yeniləyin. Problem təkrarlanarsa, bizimlə əlaqə saxlayın.</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Səhifəni yenilə
          </button>
        </div>
      </div>
    );
  }
}
