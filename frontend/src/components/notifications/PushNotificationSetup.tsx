"use client";

import { useEffect } from "react";
import { usePushNotification } from "@/lib/notifications/usePushNotification";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.error("[SW] registration failed:", e);
      });
    }
  }, []);

  return null;
}

function PushSubscriber() {
  usePushNotification();
  return null;
}

export function PushNotificationSetup() {
  return (
    <>
      <ServiceWorkerRegistrar />
      <PushSubscriber />
    </>
  );
}
