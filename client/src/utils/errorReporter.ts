import { api } from "../services/api";

const sent = new Set<string>();

export const reportError = (message: string, stack?: string) => {
  if (import.meta.env.DEV || sent.size >= 10 || sent.has(message)) return;
  sent.add(message);
  api.post("/client-errors", { message: message.slice(0, 1000), stack: stack?.slice(0, 5000), url: window.location.href }).catch(() => undefined);
};

export const installErrorReporter = () => {
  window.addEventListener("error", (event) => reportError(event.message, event.error?.stack));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportError(reason instanceof Error ? reason.message : String(reason), reason instanceof Error ? reason.stack : undefined);
  });
};
