import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { WebView as WebViewType } from "react-native-webview";
import type { PromoVideoPlayerProps } from "./promoVideoShared";

const FORCE_PLAY_SCRIPT = `
(function(){
  var v=document.getElementById('v');
  if(!v){ return true; }
  try {
    v.muted=true;
    v.defaultMuted=true;
    v.volume=0;
    v.setAttribute('muted','');
    v.playsInline=true;
    v.setAttribute('playsinline','');
    v.setAttribute('webkit-playsinline','');
    var p=v.play();
    if(p&&p.then){
      p.then(function(){
        try{ window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('playing'); }catch(e){}
      }).catch(function(){
        try{ window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('play_fail'); }catch(e){}
      });
    }
  } catch (e) {}
  return true;
})();
true;
`;

function buildVideoHtml(
  videoUrl: string,
  posterUrl: string | undefined,
  opts: { lockMute: boolean; controls: boolean; objectFit: "cover" | "contain" },
) {
  const safeVideo = videoUrl.replace(/"/g, "&quot;");
  const safePoster = (posterUrl || "").replace(/"/g, "&quot;");

  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<style>
html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden}
video{width:100%;height:100%;object-fit:${opts.objectFit};display:block;background:#000}
</style></head><body>
<video id="v" src="${safeVideo}" ${safePoster ? `poster="${safePoster}"` : ""}
  autoplay muted defaultMuted loop playsinline webkit-playsinline
  preload="auto" ${opts.controls ? "controls" : ""}></video>
<script>
(function(){
  var v=document.getElementById('v');
  if(!v) return;
  var lockMute=${opts.lockMute ? "true" : "false"};
  function forceMute(){
    v.muted=true;
    v.defaultMuted=true;
    v.volume=0;
    v.setAttribute('muted','');
  }
  forceMute();
  v.playsInline=true;
  v.setAttribute('playsinline','');
  v.setAttribute('webkit-playsinline','');
  function tryPlay(){
    if(lockMute || v.paused) forceMute();
    var p=v.play();
    if(p&&p.then) p.then(function(){ if(lockMute) forceMute(); }).catch(function(){});
  }
  v.addEventListener('loadedmetadata', tryPlay);
  v.addEventListener('loadeddata', tryPlay);
  v.addEventListener('canplay', tryPlay);
  v.addEventListener('canplaythrough', tryPlay);
  if(lockMute){
    v.addEventListener('volumechange', function(){
      if(!v.paused && (v.volume>0 || !v.muted)) forceMute();
    });
  }
  tryPlay();
  setTimeout(tryPlay, 200);
  setTimeout(tryPlay, 800);
  setTimeout(tryPlay, 2000);
})();
</script>
</body></html>`;
}

function PromoVideoPlayerNative({
  videoUrl,
  posterUrl,
  lockMute = false,
  controls = false,
  objectFit = "cover",
  style,
  active = true,
}: PromoVideoPlayerProps) {
  const webRef = useRef<WebViewType>(null);
  const playingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const html = useMemo(
    () =>
      buildVideoHtml(videoUrl, posterUrl, {
        lockMute,
        controls,
        objectFit,
      }),
    [videoUrl, posterUrl, lockMute, controls, objectFit],
  );

  const runPlayScript = useCallback(() => {
    webRef.current?.injectJavaScript(FORCE_PLAY_SCRIPT);
  }, []);

  const stopRetry = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRetry = useCallback(() => {
    playingRef.current = false;
    stopRetry();
    runPlayScript();

    let attempts = 0;
    timerRef.current = setInterval(() => {
      attempts += 1;
      if (playingRef.current || attempts > 15) {
        stopRetry();
        return;
      }
      runPlayScript();
    }, 400);
  }, [runPlayScript, stopRetry]);

  useEffect(() => {
    if (!active) {
      stopRetry();
    }
    return () => {
      stopRetry();
    };
  }, [active, stopRetry]);

  const onLoadEnd = useCallback(() => {
    if (active) {
      startRetry();
    }
  }, [active, startRetry]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (event.nativeEvent.data === "playing") {
        playingRef.current = true;
        stopRetry();
      }
    },
    [stopRetry],
  );

  const pointerEvents = controls ? "auto" : "none";

  return (
    <View style={[styles.fill, style]} pointerEvents={pointerEvents}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: "https://localhost/" }}
        originWhitelist={["*"]}
        style={styles.fill}
        scrollEnabled={false}
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType="hardware"
        injectedJavaScript={FORCE_PLAY_SCRIPT}
        onLoadEnd={onLoadEnd}
        onMessage={onMessage}
      />
    </View>
  );
}

export default memo(PromoVideoPlayerNative);

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
  },
});