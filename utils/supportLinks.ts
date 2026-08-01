import { Linking, Platform } from "react-native";
import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/constants/AppStores";
import {
  STORE_MAPS_URL,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_SUBJECT,
  SUPPORT_PHONE_DIGITS,
  SUPPORT_WHATSAPP_DIGITS,
  SUPPORT_WHATSAPP_PREFILL,
} from "@/constants/SupportContact";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function getWhatsAppUrl(message = SUPPORT_WHATSAPP_PREFILL) {
  const phone = digitsOnly(SUPPORT_WHATSAPP_DIGITS);
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}

export function getTelUrl() {
  const phone = digitsOnly(SUPPORT_PHONE_DIGITS);
  return `tel:+${phone}`;
}

export function getMailtoUrl(
  subject = SUPPORT_EMAIL_SUBJECT,
  body = SUPPORT_WHATSAPP_PREFILL,
) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

async function openExternalUrl(url: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  await Linking.openURL(url);
}

/** Opens WhatsApp (app on mobile via wa.me, web chat/new tab on web). */
export async function openWhatsApp(message = SUPPORT_WHATSAPP_PREFILL) {
  await openExternalUrl(getWhatsAppUrl(message));
}

/** Opens the native dialer / browser tel handler. */
export async function openPhoneCall() {
  await Linking.openURL(getTelUrl());
}

/** Opens the default mail client. */
export async function openSupportEmail() {
  await Linking.openURL(getMailtoUrl());
}

/** Opens the store location in Google Maps (app or browser). */
export async function openStoreMaps() {
  await openExternalUrl(STORE_MAPS_URL);
}

/** Opens the iOS App Store listing. */
export async function openIosAppStore() {
  await openExternalUrl(IOS_APP_STORE_URL);
}

/** Opens the Google Play Store listing. */
export async function openAndroidPlayStore() {
  await openExternalUrl(ANDROID_PLAY_STORE_URL);
}
