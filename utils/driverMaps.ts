import { Linking, Platform } from "react-native";

export function openGoogleMapsNavigation(latitude: number, longitude: number) {
  const dest = `${latitude},${longitude}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;

  if (Platform.OS === "web") {
    Linking.openURL(webUrl);
    return;
  }

  const nativeUrl =
    Platform.OS === "ios"
      ? `comgooglemaps://?daddr=${dest}&directionsmode=driving`
      : `google.navigation:q=${dest}`;

  Linking.canOpenURL(nativeUrl)
    .then((supported) => Linking.openURL(supported ? nativeUrl : webUrl))
    .catch(() => Linking.openURL(webUrl));
}
