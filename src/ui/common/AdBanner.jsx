import React, { useRef, useEffect, memo } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// ADSENSE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
// Publisher ID — single source of truth
const AD_CLIENT = "ca-pub-3289752970133191";

// ── Bootstrap AdSense script once per page load ───────────────────────────
// We inject the <script> tag into <head> ourselves so this works whether the
// app is embedded in index.html or rendered standalone. Guard prevents double
// injection on React StrictMode double-mount.
function _loadAdSense() {
  if (typeof document === "undefined") return;
  const existing = document.querySelector('script[src*="adsbygoogle"]');
  if (existing) return; // already injected (or present in index.html)
  const s = document.createElement("script");
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + AD_CLIENT;
  s.async = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

// ── <AdBanner> — production-grade ad unit ────────────────────────────────
// Props:
//   slot        {string}  AdSense ad slot ID (from AdSense dashboard)
//   format      {string}  "auto" | "rectangle" | "horizontal"  (default "auto")
//   responsive  {boolean} whether to use data-full-width-responsive (default true)
//   style       {object}  extra wrapper style overrides
//
// Design principles:
//   • One <ins> per component instance — never re-pushed after mount
//   • Stable min-height placeholder → zero CLS (Cumulative Layout Shift)
//   • IntersectionObserver lazy-load → push only when visible
//   • Cleanup on unmount → no orphaned <ins> or listeners
//   • Memoised — won't re-render on parent updates
export const AdBanner = memo(function AdBanner({
  slot,
  format      = "auto",
  responsive  = true,
  style       = {},
}) {
  const insRef   = useRef(null);
  const pushed   = useRef(false);   // guard: push() called at most once per mount
  const obsRef   = useRef(null);    // IntersectionObserver reference

  useEffect(() => {
    // Ensure the AdSense script is in the page
    _loadAdSense();

    const ins = insRef.current;
    if (!ins || pushed.current) return;

    // Lazy-push: only call adsbygoogle.push() when the banner enters the
    // viewport (avoids pushing ads for off-screen placements that were never
    // seen, which wastes impressions and slows initial load).
    const pushAd = () => {
      if (pushed.current) return;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Swallow "All 'ins' elements already have ads" — harmless in SPA
        if (!e.message?.includes("already")) {
          console.warn("[AdBanner] adsbygoogle.push error:", e.message);
        }
      }
    };

    // IntersectionObserver — push when ≥50% visible
    if (typeof IntersectionObserver !== "undefined") {
      obsRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            pushAd();
            obsRef.current?.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      obsRef.current.observe(ins);
    } else {
      // Fallback for environments without IntersectionObserver (SSR, old browsers)
      pushAd();
    }

    return () => {
      // Cleanup: disconnect observer; pushed.current stays true so re-mount
      // (StrictMode) doesn't double-push the same <ins>
      obsRef.current?.disconnect();
    };
  }, []);

  // Minimal-height placeholder eliminates CLS.
  // Heights match typical AdSense unit sizes for each format.
  const minH = format === "horizontal"  ? 90  :
               format === "rectangle"   ? 250 : 100;

  return (
    <div
      style={{
        display:    "block",
        textAlign:  "center",
        overflow:   "hidden",
        minHeight:  minH,
        background: "transparent",
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive ? { "data-full-width-responsive": "true" } : {})}
      />
    </div>
  );
});
