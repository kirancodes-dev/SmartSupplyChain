"use client";
import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { showToast } from "./ToastProvider";

export default function PushNotifications({ alertCount }: { alertCount?: number }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [swReady, setSwReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        setSwReady(true);
        if (Notification.permission === "granted") setEnabled(true);
      }).catch(() => {});
    }
  }, []);

  const enable = useCallback(async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      setEnabled(true);
      // Test notification
      new Notification("Smart Supply Chain AI", {
        body: "✅ Push notifications enabled! You'll be alerted of critical supply chain events.",
        icon: "/favicon.ico",
      });
      showToast({ type: "success", title: "Notifications Enabled", message: "You'll receive alerts even when the tab is closed." });
    }
  }, []);

  // Send a browser notification for critical alerts
  const sendAlert = useCallback((title: string, body: string, url = "/dashboard") => {
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/favicon.ico", tag: "ssc-critical" });
  }, []);

  // Expose globally for other components to use
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__sendPushAlert = sendAlert;
    }
  }, [sendAlert]);

  if (typeof window === "undefined" || !("Notification" in window)) return null;

  return (
    <button
      onClick={enabled ? () => {
        setEnabled(false);
        showToast({ type: "info", title: "Notifications Paused", message: "Re-enable anytime from the notification bell." });
      } : enable}
      title={enabled ? "Push notifications ON — click to disable" : "Enable push notifications"}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
        enabled ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-white/10 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10"
      }`}
    >
      {enabled ? <BellRing size={15} className="animate-[wiggle_0.5s_ease-in-out_infinite]"/> : permission === "denied" ? <BellOff size={15}/> : <Bell size={15}/>}
      {enabled && alertCount && alertCount > 0 ? (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
          {alertCount > 9 ? "9+" : alertCount}
        </span>
      ) : null}
    </button>
  );
}
