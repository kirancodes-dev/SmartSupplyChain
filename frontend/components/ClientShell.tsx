"use client";
import FloatingDock from "@/components/FloatingDock";
import Breadcrumb from "@/components/Breadcrumb";
import LiveStatusBar from "@/components/LiveStatusBar";
import { usePathname } from "next/navigation";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hideBar = path === "/home" || path === "/" || path === "/mobile";
  return (
    <>
      {!hideBar && <LiveStatusBar />}
      <Breadcrumb />
      {children}
      <FloatingDock />
    </>
  );
}
