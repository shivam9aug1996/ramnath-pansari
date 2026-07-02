import { Linking, Platform } from "react-native";

export function openGoogleMapsNavigation(latitude: number, longitude: number) {
  const dest = `${latitude},${longitude}`;
  const nativeUrl =
    Platform.OS === "ios"
      ? `comgooglemaps://?daddr=${dest}&directionsmode=driving`
      : `google.navigation:q=${dest}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;

  Linking.canOpenURL(nativeUrl)
    .then((supported) => Linking.openURL(supported ? nativeUrl : webUrl))
    .catch(() => Linking.openURL(webUrl));
}
