"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "ig_vid";
const SESSION_KEY = "ig_sid";
const CONSENT_KEY = "ig_cookie_consent";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vid = localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, vid);
  }
  return vid;
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

function setSessionId(sid: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, sid);
  }
}

function getUTMParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  const consent = localStorage.getItem(CONSENT_KEY);
  // If no consent decision yet, allow analytics (opt-out model)
  // User can decline via cookie banner which sets this to "declined"
  return consent !== "declined";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef("");

  const trackPageView = useCallback(async (path: string) => {
    if (!hasConsent()) return;

    try {
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;

      const sessionId = getSessionId();
      const utm = getUTMParams();

      const res = await fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          path,
          title: document.title,
          referrer: document.referrer || undefined,
          ...utm,
        }),
        // Use keepalive so requests survive page navigation
        keepalive: true,
      });

      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
    } catch {
      // Silently fail — analytics should never break the UX
    }
  }, []);

  useEffect(() => {
    const fullPath = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Avoid duplicate tracking for the same path
    if (fullPath === lastPath.current) return;
    lastPath.current = fullPath;

    // Small delay to let document.title update
    const timer = setTimeout(() => trackPageView(fullPath), 100);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, trackPageView]);

  return null;
}
