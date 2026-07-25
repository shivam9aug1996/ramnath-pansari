import { Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

type JitterEvent = {
  y: number;
  dy: number;
  dt: number;
  avg: number;
  jump: boolean;
  hitch: boolean;
};

type GestureSummary = {
  samples: number;
  jumpCount: number;
  hitchCount: number;
  maxAbsDy: number;
  maxDt: number;
  deltaY: number;
  dirty: boolean;
};



export function InitialLayout1() {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const isDragging = useSharedValue(0);
  const lastY = useSharedValue(0);
  const lastT = useSharedValue(0);
  const avgAbsDy = useSharedValue(0);
  const samples = useSharedValue(0);
  const jumpCount = useSharedValue(0);
  const hitchCount = useSharedValue(0);
  const maxAbsDy = useSharedValue(0);
  const maxDt = useSharedValue(0);
  const startY = useSharedValue(0);
  const endY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: (e) => {
      isDragging.value = 1;
      lastY.value = e.contentOffset.y;
      lastT.value = 0;
      avgAbsDy.value = 0;
      samples.value = 0;
      jumpCount.value = 0;
      hitchCount.value = 0;
      maxAbsDy.value = 0;
      maxDt.value = 0;
      startY.value = e.contentOffset.y;
      endY.value = e.contentOffset.y;
    },
    onScroll: (e) => {
      if (isDragging.value !== 1) return;

      const y = e.contentOffset.y;
      const t = Date.now();

      if (lastT.value === 0) {
        lastY.value = y;
        lastT.value = t;
        startY.value = y;
        endY.value = y;
        return;
      }

      const dy = y - lastY.value;
      const dt = t - lastT.value;
      const absDy = Math.abs(dy);

      avgAbsDy.value =
        avgAbsDy.value === 0 ? absDy : avgAbsDy.value * 0.8 + absDy * 0.2;

      const jump = absDy > Math.max(8, avgAbsDy.value * 4);
      const hitch = dt > 50;

      samples.value += 1;
      endY.value = y;
      if (absDy > maxAbsDy.value) maxAbsDy.value = absDy;
      if (dt > maxDt.value) maxDt.value = dt;
      if (jump) jumpCount.value += 1;
      if (hitch) hitchCount.value += 1;

      lastY.value = y;
      lastT.value = t;
    },
    onEndDrag: () => {
      isDragging.value = 0;
    },
  });

  return (
    <Animated.FlatList
      data={data}
      keyExtractor={(item) => item.toString()}
      onScroll={onScroll}
      //scrollEventThrottle={200}
      renderItem={({ item }) => (
        <View
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: "black",
            minHeight: 200,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>{item}</Text>
        </View>
      )}
    />
  );
}
