import { Stack } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminTheme } from "@/app/admin/theme";
import { useRoleRouteGuard } from "@/hooks/useRoleRouteGuard";

export default function DriverLayout() {
  const insets = useSafeAreaInsets();
  useRoleRouteGuard("driver");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: adminTheme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "ios_from_right",
          contentStyle: { backgroundColor: adminTheme.screenBg },
        }}
      />
    </View>
  );
}
