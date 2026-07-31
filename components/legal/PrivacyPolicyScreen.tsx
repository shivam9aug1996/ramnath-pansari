import React from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TextWithMontserratDigits from "@/components/TextWithMontserratDigits";
import { Colors } from "@/constants/Colors";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/constants/SupportContact";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import AppHead from "@/components/AppHead";

const LAST_UPDATED = "31 July 2026";

const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Who we are",
    body: `Ramnath Pansari (“we”, “us”) operates the Ramnath Pansari grocery ordering app and website for customers in and around our store service area. This Privacy Policy explains what personal information we collect, why we use it, and how you can contact us.`,
  },
  {
    title: "Information we collect",
    body:
      "• Account: mobile number, password (stored in hashed form on our servers), optional name and profile photo.\n" +
      "• Guest browsing: a limited guest session so you can explore the catalogue without a full account.\n" +
      "• Delivery addresses: recipient name, phone, address text, and map location (latitude/longitude).\n" +
      "• Device location: with your permission, to help set delivery addresses, check our delivery radius, and show local weather in greetings.\n" +
      "• Orders and cart: products you add, quantities, order history, and payment status.\n" +
      "• Search and browsing: recent searches and recently viewed products (to improve shopping and greetings).\n" +
      "• Notifications: a push notification token so we can send order and account updates.\n" +
      "• Technical data: app or browser diagnostics used for security, crash reporting, and performance (may include device/app information).",
  },
  {
    title: "How we use your information",
    body:
      "We use this information to create and secure your account, take and deliver orders, process payments (including cash on delivery), show store hours and delivery eligibility, send push updates about orders, personalise greetings, prevent abuse of our services, and respond to support requests.",
  },
  {
    title: "How we share information",
    body:
      "We share data only as needed to run the service:\n" +
      "• Our hosting and API infrastructure (to store accounts, carts, addresses, and orders).\n" +
      "• Payment processing (for example Razorpay) when you pay online — they receive details needed to complete payment, such as amount and contact/name prefills.\n" +
      "• Maps and places services (for example Google) for address search, geocoding, and opening our store location.\n" +
      "• Image hosting (for profile or address map previews).\n" +
      "• Push notification providers (for example Expo) to deliver notifications.\n" +
      "• Analytics and error monitoring (for example Sentry; on web, Vercel Analytics) to keep the app reliable.\n" +
      "• Delivery partners/drivers assigned to your order may see your name, phone, and delivery address to complete delivery.\n\n" +
      "We do not sell your personal information.",
  },
  {
    title: "Data stored on your device",
    body:
      "The app may store a login token, profile summary, cart cache, and similar data on your device (secure storage on mobile; browser storage on web) so you stay signed in and the app loads faster. You can clear app data or log out to remove local session data.",
  },
  {
    title: "Account deletion",
    body:
      "You can delete your account from Profile → Delete Account. This removes your user profile, cart, saved addresses, search history, push tokens, and orders from our primary customer database, and deletes associated profile images we host.\n\n" +
      "Some records may remain where required for payments, fraud prevention, legal obligations, or in backup systems for a limited time. Third parties such as Razorpay may retain payment records under their own policies.",
  },
  {
    title: "Children",
    body:
      "Our service is intended for adults placing grocery orders. We do not knowingly collect personal information from children.",
  },
  {
    title: "Changes",
    body:
      "We may update this Privacy Policy from time to time. The “Last updated” date at the top will change when we do. Continued use of the app after an update means you accept the revised policy.",
  },
  {
    title: "Contact",
    body:
      `Questions about privacy?\n\n` +
      `Email\n${SUPPORT_EMAIL}\n\n` +
      `Call\n${SUPPORT_PHONE_DISPLAY}`,
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <>
      <AppHead
        title="Privacy Policy"
        description="How Ramnath Pansari collects and uses your information"
      />
      <ScreenSafeWrapper showBackButton title="Privacy Policy">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS !== "android"}
        >
          <TextWithMontserratDigits
            text={`Last updated: ${LAST_UPDATED}`}
            lightColor={Colors.light.mediumGrey}
            style={styles.updated}
          />
          {PRIVACY_SECTIONS.map((section) => (
            <ThemedView key={section.title} style={styles.section}>
              <ThemedText
                lightColor={Colors.light.darkGreen}
                style={styles.heading}
              >
                {section.title}
              </ThemedText>
              <TextWithMontserratDigits
                text={section.body}
                lightColor={Colors.light.mediumLightGrey}
                style={styles.body}
              />
            </ThemedView>
          ))}
        </ScrollView>
      </ScreenSafeWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  updated: {
    fontSize: 12,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontFamily: "Raleway_700Bold",
    marginBottom: 8,
  },
  body: {
    lineHeight: 21,
    fontSize: 14,
  },
});
