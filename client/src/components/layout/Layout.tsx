import { Outlet } from "react-router-dom";
import ApiStatusBanner from "../common/ApiStatusBanner";
import CompareBar from "../product/CompareBar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ApiStatusBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-40 md:pb-28">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <BottomNav />
    </div>
  );
}
