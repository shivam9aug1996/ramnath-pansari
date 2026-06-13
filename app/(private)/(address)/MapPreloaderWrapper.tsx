import MapPreloader from "./MapPreloader";
import DeferredFadeIn from "@/components/DeferredFadeIn";

const MAP_PRELOAD_DELAY_MS = 1000;

const MapPreloaderWrapper = () => {
  return (
    <DeferredFadeIn delay={MAP_PRELOAD_DELAY_MS}>
      <MapPreloader />
    </DeferredFadeIn>
  );
};

export default MapPreloaderWrapper;
