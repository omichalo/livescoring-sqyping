/**
 * Empêche le rechargement accidentel de la page (tablettes, F5, pull-to-refresh).
 * Utile quand une iframe tierce (mode ITTF) ne supporte pas le refresh.
 */

"use client";

import { useEffect, useRef } from "react";

export function usePreventPageReload(enabled: boolean): void {
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const isReloadShortcut =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

      if (isReloadShortcut) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || touchStartYRef.current === null) {
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const pullingDown = currentY > touchStartYRef.current;
      const scrollTop = document.scrollingElement?.scrollTop ?? window.scrollY;

      if (pullingDown && scrollTop <= 0) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);
}
