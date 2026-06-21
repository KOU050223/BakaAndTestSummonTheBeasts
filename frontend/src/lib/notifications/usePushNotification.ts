"use client";

import { useEffect, useRef } from "react";
import { fetchClient } from "@/lib/api/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

async function syncSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return;

  await fetchClient.POST("/api/push_subscriptions" as never, {
    body: { endpoint, p256dh, auth },
  } as never);
}

export function usePushNotification() {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    subscribedRef.current = true;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await syncSubscription(existing);
          return;
        }

        if (Notification.permission !== "granted") {
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await syncSubscription(subscription);
      } catch (e) {
        console.error("[PushNotification] subscribe failed:", e);
      }
    })();
  }, []);
}
