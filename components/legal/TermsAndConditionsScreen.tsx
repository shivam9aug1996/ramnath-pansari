import React from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TextWithMontserratDigits from "@/components/TextWithMontserratDigits";
import { Colors } from "@/constants/Colors";
import {
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
} from "@/constants/SupportContact";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import AppHead from "@/components/AppHead";

const LAST_UPDATED = "31 July 2026";

const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Agreement",
    body:
      "By creating an account or using the Ramnath Pansari app or website (“Service”), you agree to these Terms and Conditions. If you do not agree, please do not use the Service.\n\n" +
      `The Service is operated by ${STORE_NAME} for grocery ordering and delivery within our published service area.`,
  },
  {
    title: "Accounts",
    body:
      "You must provide a valid mobile number and keep your login credentials secure. You are responsible for activity under your account.\n\n" +
      "Guest mode lets you browse with limited features. Some actions (placing orders, saving addresses, managing a full profile) require a registered account.\n\n" +
      "You may delete your account from Profile. Deletion is described in our Privacy Policy.",
  },
  {
    title: "Orders, prices, and availability",
    body:
      "Product prices, discounts, offers, and stock can change. An order is accepted when we confirm it in the app (including cash on delivery or online payment flows).\n\n" +
      "We may refuse, cancel, or partially fulfil an order if an item is unavailable, payment fails, the delivery address is outside our radius, the store is closed or not accepting orders, or we detect misuse.",
  },
  {
    title: "Delivery",
    body:
      "We deliver only within the delivery radius shown in the app (About → Delivery radius), measured from our store. You must provide an accurate address and reachable phone number.\n\n" +
      "Delivery fees, free-delivery thresholds, and timing estimates may change and are shown at checkout when available. Delays can occur due to traffic, weather, high demand, or other reasons beyond our control.",
  },
  {
    title: "Payments",
    body:
      "We may offer cash on delivery and online payment options. Online payments are processed by third-party payment providers (for example Razorpay). Their terms and privacy practices also apply to payment processing.\n\n" +
      "You agree to pay the amounts shown at checkout, including applicable delivery charges and discounts.",
  },
  {
    title: "Promotions and content",
    body:
      "Offers, freebies, home promos, and banners are subject to their stated rules and may be withdrawn or changed. Product images and descriptions are for guidance; packaging may vary.",
  },
  {
    title: "Acceptable use",
    body:
      "You agree not to misuse the Service, attempt unauthorised access, interfere with other users, or use the Service for unlawful purposes. We may suspend accounts that violate these Terms.",
  },
  {
    title: "Privacy",
    body:
      "How we collect and use personal information is explained in our Privacy Policy. By using the Service you also acknowledge that policy.",
  },
  {
    title: "Limitation of liability",
    body:
      "To the fullest extent permitted by law, Ramnath Pansari is not liable for indirect or consequential losses arising from use of the Service. Our total liability for a specific order is limited to the amount you paid for that order, except where liability cannot be limited by law.",
  },
  {
    title: "Changes",
    body:
      "We may update these Terms at any time. Updates take effect when posted in the app unless we state otherwise. Continued use after changes means you accept the updated Terms. Please review this page periodically.\n\n" +
      `Last updated: ${LAST_UPDATED}.`,
  },
  {
    title: "Contact",
    body:
      `Questions about these Terms?\n\n` +
      `Email\n${SUPPORT_EMAIL}\n\n` +
      `Call\n${SUPPORT_PHONE_DISPLAY}`,
  },
];

export default function TermsAndConditionsScreen() {
  return (
    <>
      <AppHead
        title="Terms and Conditions"
        description="Terms for using the Ramnath Pansari app"
      />
      <ScreenSafeWrapper showBackButton title="Terms and Conditions">
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
          {TERMS_SECTIONS.map((section) => (
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
