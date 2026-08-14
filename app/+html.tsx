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
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
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
  justify-content: center;
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

/* Desktop framing tweaks */
@media (min-width: 520px) {
  #root {
    width: 430px;
    max-width: 430px;
    height: calc(100% - 24px);
    max-height: 920px;
    border-radius: 28px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    overflow: hidden;
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
