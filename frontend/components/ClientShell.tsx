"use client";
import FloatingDock from "@/components/FloatingDock";
import Breadcrumb from "@/components/Breadcrumb";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Breadcrumb />
      {children}
      <FloatingDock />
    </>
  );
}
