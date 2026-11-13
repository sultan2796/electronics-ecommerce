import React from "react";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Overlays from "./components/common/Overlays";
import QuickView from "./components/product/QuickView";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CompareProvider } from "./context/CompareContext";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider, LocaleBoundary } from "./context/I18nContext";
import { WishlistProvider } from "./context/WishlistContext";
import "./index.css";
import { installErrorReporter } from "./utils/errorReporter";

installErrorReporter();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
        <SiteSettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <LocaleBoundary>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <App />
                  <Overlays />
                  <QuickView />
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
            </LocaleBoundary>
          </AuthProvider>
        </BrowserRouter>
        </SiteSettingsProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
