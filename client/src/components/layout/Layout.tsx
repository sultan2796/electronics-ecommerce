import { Outlet } from "react-router-dom";
import CompareBar from "../product/CompareBar";
import BottomNav from "./BottomNav";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-40 md:pb-28">
        <Outlet />
      </main>
      <footer className="hidden border-t border-chip bg-navbar py-6 text-center text-xs text-muted md:block">
        © {new Date().getFullYear()} ElectroShop
      </footer>
      <CompareBar />
      <BottomNav />
    </div>
  );
}
