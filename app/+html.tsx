import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/*
          Explicit icons for Chrome tabs + Google Search (needs a square PNG, multiple of 48px).
          Expo also injects /favicon.ico from app.json web.favicon; keep both.
        */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon-48.png" sizes="48x48" />
        <link rel="icon" type="image/png" href="/favicon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/*
          Warm cross-origin connections used early on /home (API + product/promo CDNs).
          Skip same-origin (www.ramnathpansari.com). Keep this list short — too many hurts.
        */}
        <link
          rel="preconnect"
          href="https://ramnath-pansari-nextjs.vercel.app"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://ramnath-pansari-nextjs.vercel.app" />
        <link
          rel="preconnect"
          href="https://api.ramnathpansari.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.ramnathpansari.com" />
        {/* Image/video CDNs: no crossOrigin — <img>/<video> use non-CORS connections */}
        <link rel="preconnect" href="https://cdn1.jiomartjcp.com" />
        <link rel="dns-prefetch" href="https://cdn1.jiomartjcp.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure background color never flickers in dark-mode */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>
        <div id="web-brand-bar" aria-hidden="true">
          <div className="web-brand-skeleton">
            <span className="web-brand-skel-logo" />
            <span className="web-brand-skel-text" />
          </div>
          <div className="web-brand-content">
            <img src="/brand-logo.webp" alt="" />
            <span>Ramnath Pansari</span>
          </div>
        </div>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  function ready() {
    requestAnimationFrame(function () {
      document.documentElement.classList.add("web-shell-ready");
    });
  }
  if (document.readyState === "complete") ready();
  else window.addEventListener("load", ready, { once: true });

  // Async routes: stale/missing chunks can 404 after deploy. Reload once to pick up new hashes.
  var CHUNK_RELOAD_KEY = "__expo_async_chunk_reload";
  var alreadyReloaded = false;
  try {
    alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
  } catch (e) {}
  if (alreadyReloaded) {
    setTimeout(function () {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch (e) {}
    }, 5000);
  }
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason;
    var name = (reason && reason.name) || "";
    var message = String((reason && reason.message) || reason || "");
    var isChunkError =
      name === "AsyncRequireError" ||
      message.indexOf("AsyncRequireError") !== -1 ||
      message.indexOf("Loading module") !== -1 ||
      message.indexOf("Failed to fetch dynamically imported module") !== -1 ||
      message.indexOf("Importing a module script failed") !== -1;
    if (!isChunkError || alreadyReloaded) return;
    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    } catch (e) {}
    window.location.reload();
  });
})();
`,
          }}
        />
      </body>
    </html>
  );
}

const responsiveBackground = `
/* Base resets for browser consistency */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

body {
  background: linear-gradient(165deg, #f4f1ea 0%, #e5eee6 55%, #dfe9e2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Default mobile container layout */
#root {
  width: 100%;
  max-width: 430px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  background-color: #ffffff;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.14);
}

/* Desktop-only brand chip above the phone frame */
#web-brand-bar {
  display: none;
  align-items: center;
  flex-shrink: 0;
  margin-top: 20px;
  margin-bottom: 12px;
  padding: 8px 16px 8px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
  z-index: 2;
  position: relative;
  overflow: hidden;
  min-height: 52px;
  min-width: 180px;
  width: max-content;
}

.web-brand-skeleton,
.web-brand-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.web-brand-content {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  pointer-events: none;
}

.web-brand-skel-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e4ebe5;
  flex-shrink: 0;
}

.web-brand-skel-text {
  width: 118px;
  height: 12px;
  border-radius: 999px;
  background: #e4ebe5;
  flex-shrink: 0;
}

.web-brand-content img {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.web-brand-content span {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #2f3a2f;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

@keyframes web-brand-skel-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

@keyframes web-brand-content-in {
  from {
    opacity: 0;
    transform: translateY(calc(-50% + 6px));
  }
  to {
    opacity: 1;
    transform: translateY(-50%);
  }
}

@keyframes web-brand-skel-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes web-brand-logo-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

/* Desktop framing tweaks */
@media (min-width: 520px) {
  /*
    Default desktop look = Chrome zoom 75%, with Chrome left at 100% (⌘0).
    Height is expanded by 1/0.75 so after zoom the frame still fills the
    viewport — more content fits, without the tiny floating phone.
  */
  #web-brand-bar,
  #root {
    zoom: 0.75;
  }

  #web-brand-bar {
    display: flex;
  }

  .web-brand-skel-logo,
  .web-brand-skel-text {
    animation: web-brand-skel-pulse 1.1s ease-in-out infinite;
  }

  /* Swap skeleton → real brand after load (no #root animation) */
  html.web-shell-ready .web-brand-skeleton {
    animation: web-brand-skel-out 220ms ease forwards;
    pointer-events: none;
  }

  html.web-shell-ready .web-brand-content {
    pointer-events: auto;
    animation: web-brand-content-in 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms forwards;
  }

  html.web-shell-ready .web-brand-content img {
    animation: web-brand-logo-float 3.2s ease-in-out 600ms infinite;
  }

  #root {
    width: 430px;
    max-width: 430px;
    height: calc((100% - 88px) / 0.75);
    max-height: calc(920px / 0.75);
    border-radius: 28px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .web-brand-skel-logo,
  .web-brand-skel-text,
  .web-brand-skeleton,
  .web-brand-content,
  .web-brand-content img {
    animation: none !important;
  }

  html.web-shell-ready .web-brand-skeleton {
    opacity: 0;
  }

  html.web-shell-ready .web-brand-content {
    opacity: 1;
  }
}

/* Fix specific slider/input browser defaults */
[data-testid="onboarding-slider"] > div > div {
  display: contents !important;
}

input:focus, textarea:focus, select:focus {
  outline: none;
}
`;