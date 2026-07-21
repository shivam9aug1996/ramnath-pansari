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
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>
        <div id="web-brand-bar" aria-hidden="true">
          <img src="/web-logo.png" alt="" />
          <span>Ramnath Pansari</span>
        </div>
        {children}
      </body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background: linear-gradient(165deg, #f4f1ea 0%, #e5eee6 55%, #dfe9e2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* Desktop-only brand chip above the phone frame — never clipped by side gutters */
#web-brand-bar {
  display: none;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-top: 20px;
  margin-bottom: 12px;
  padding: 8px 16px 8px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
  z-index: 2;
}

#web-brand-bar img {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
}

#web-brand-bar span {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #2f3a2f;
  letter-spacing: 0.01em;
}

@media (min-width: 520px) {
  #web-brand-bar {
    display: flex;
  }

  #root {
    height: calc(100% - 88px);
    max-height: 920px;
    border-radius: 28px;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }
}

/* Keep the web app phone-sized on wide screens (no stretch) */
#root {
  width: 100%;
  max-width: 430px;
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;
  background-color: #fff;
  /* Contain fixed/absolute overlays (modals, sheets, toast) inside the phone frame */
  transform: translateZ(0);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.14);
}

[data-testid="onboarding-slider"] > div > div {
  display: contents !important;
}

input:focus {
  outline: none;
}

textarea:focus {
  outline: none;
}
`;
