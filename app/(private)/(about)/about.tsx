import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHead from "@/components/AppHead";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import {
  STORE_ADDRESS_LINES,
  STORE_NAME,
} from "@/constants/SupportContact";
import {
  FSSAI_CATEGORY,
  FSSAI_KIND_OF_BUSINESS,
  FSSAI_LICENSE_NUMBER,
  FSSAI_LICENSEE_NAME,
  FSSAI_VALID_UPTO,
  UDYAM_ENTERPRISE_NAME,
  UDYAM_REGISTRATION_NUMBER,
  UDYAM_TYPE,
} from "@/constants/Licenses";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { openFssaiVerify, openStoreMaps } from "@/utils/supportLinks";
import GetTheApp from "@/components/GetTheApp";

const ABOUT_COPY =
  "Ramnath Pansari is your neighbourhood grocery store — fresh staples, daily essentials, and trusted brands delivered to your door. We keep it simple: fair prices, careful packing, and friendly local service.";

export default function AboutScreen() {
  const storeConfig = useStoreConfig({ fetch: true });
  const { radiusKm } = storeConfig.deliveryRadius;

  const onOpenMaps = useCallback(() => {
    void openStoreMaps();
  }, []);

  const onVerifyFssai = useCallback(() => {
    void openFssaiVerify();
  }, []);

  return (
    <>
      <AppHead
        title="About"
        description="About Ramnath Pansari and our delivery area"
      />
      <ScreenSafeWrapper showBackButton title="About">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS !== "android"}
        >
          <Text style={styles.brand}>Ramnath Pansari</Text>
          <Text style={styles.paragraph}>{ABOUT_COPY}</Text>

          <Pressable
            onPress={onOpenMaps}
            style={({ pressed }) => [
              styles.areaCard,
              pressed && styles.areaCardPressed,
            ]}
            accessibilityRole="link"
            accessibilityLabel="Open store address in Google Maps"
          >
            <View style={styles.areaHeader}>
              <Ionicons
                name="location-outline"
                size={20}
                color={Colors.light.darkGreen}
              />
              <Text style={styles.areaTitle}>Store address</Text>
            </View>
            <Text style={styles.storeName}>{STORE_NAME}</Text>
            {STORE_ADDRESS_LINES.map((line) => (
              <Text key={line} style={styles.addressLine}>
                {line}
              </Text>
            ))}
            <View style={styles.mapsRow}>
              <Ionicons
                name="map-outline"
                size={16}
                color={Colors.light.mediumGreen}
              />
              <Text style={styles.mapsLink}>Open in Google Maps</Text>
              <Ionicons
                name="open-outline"
                size={14}
                color={Colors.light.mediumGreen}
              />
            </View>
          </Pressable>

          <View style={styles.areaCard}>
            <View style={styles.areaHeader}>
              <Ionicons
                name="navigate-outline"
                size={20}
                color={Colors.light.darkGreen}
              />
              <Text style={styles.areaTitle}>Delivery radius</Text>
            </View>
            <Text style={styles.areaValue}>
              We deliver within about {radiusKm} km of the store. Addresses
              outside this range cannot place orders.
            </Text>
            <Text style={styles.areaMeta}>
              Checkout checks your saved address against this area before you
              place an order.
            </Text>
          </View>

          <View style={styles.areaCard}>
            <View style={styles.areaHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={Colors.light.darkGreen}
              />
              <Text style={styles.areaTitle}>Licenses</Text>
            </View>
            <Text style={styles.areaMeta}>
              We are a licensed food retailer. You can verify our FSSAI license
              on the government portal.
            </Text>

            <View style={styles.licenseBlock}>
              <Text style={styles.licenseLabel}>FSSAI</Text>
              <Text style={styles.licenseNumber}>{FSSAI_LICENSE_NUMBER}</Text>
              <Text style={styles.addressLine}>{FSSAI_LICENSEE_NAME}</Text>
              <Text style={styles.addressLine}>{FSSAI_KIND_OF_BUSINESS}</Text>
              <Text style={styles.addressLine}>{FSSAI_CATEGORY}</Text>
              <Text style={styles.addressLine}>
                Valid up to{" "}
                <Text style={styles.licenseNumberInline}>{FSSAI_VALID_UPTO}</Text>
              </Text>
            </View>

            <View style={styles.licenseBlock}>
              <Text style={styles.licenseLabel}>Udyam (MSME)</Text>
              <Text style={styles.licenseNumber}>
                {UDYAM_REGISTRATION_NUMBER}
              </Text>
              <Text style={styles.addressLine}>{UDYAM_ENTERPRISE_NAME}</Text>
              <Text style={styles.addressLine}>{UDYAM_TYPE}</Text>
            </View>

            <Pressable
              onPress={onVerifyFssai}
              style={({ pressed }) => [
                styles.mapsRow,
                pressed && styles.areaCardPressed,
              ]}
              accessibilityRole="link"
              accessibilityLabel="Verify FSSAI license on FoSCoS"
            >
              <Ionicons
                name="open-outline"
                size={16}
                color={Colors.light.mediumGreen}
              />
              <Text style={styles.mapsLink}>Verify on FoSCoS</Text>
            </Pressable>
          </View>

          <GetTheApp />
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
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 4,
    gap: 14,
  },
  brand: {
    fontFamily: "Raleway_700Bold",
    fontSize: 22,
    color: Colors.light.darkGreen,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  paragraph: {
    fontFamily: "Raleway_500Medium",
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.darkGrey,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  areaCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    padding: 18,
    gap: 8,
  },
  areaCardPressed: {
    opacity: 0.88,
  },
  areaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  areaTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 15,
    color: Colors.light.darkGreen,
  },
  storeName: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
    color: Colors.light.darkGrey,
    lineHeight: 22,
  },
  addressLine: {
    fontFamily: "Raleway_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
    lineHeight: 20,
  },
  mapsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  mapsLink: {
    flex: 1,
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGreen,
  },
  areaValue: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.darkGrey,
    lineHeight: 21,
  },
  areaMeta: {
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.mediumGrey,
  },
  licenseBlock: {
    gap: 2,
    paddingTop: 4,
  },
  licenseLabel: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    color: Colors.light.mediumGrey,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  licenseNumber: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    color: Colors.light.darkGrey,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  licenseNumberInline: {
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  },
});
