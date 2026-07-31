import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppHead from "@/components/AppHead";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/constants/SupportContact";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import {
  formatStoreHoursLabel,
  isStoreOpen,
} from "@/utils/storeConfig";
import {
  openPhoneCall,
  openSupportEmail,
  openWhatsApp,
} from "@/utils/supportLinks";

type ActionRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
};

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
}: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={Colors.light.mediumGrey}
      />
    </Pressable>
  );
}

export default function SupportScreen() {
  const storeConfig = useStoreConfig({ fetch: true });
  const open = isStoreOpen(storeConfig.storeHours);
  const hoursLabel = formatStoreHoursLabel(storeConfig.storeHours);

  const onWhatsApp = useCallback(() => {
    void openWhatsApp();
  }, []);

  const onCall = useCallback(() => {
    void openPhoneCall();
  }, []);

  const onEmail = useCallback(() => {
    void openSupportEmail();
  }, []);

  return (
    <>
      <AppHead
        title="Support"
        description="Contact Ramnath Pansari via WhatsApp, phone, or email"
      />
      <ScreenSafeWrapper showBackButton title="Help & Support">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS !== "android"}
        >
          <Text style={styles.lead}>
            Need help with an order or delivery? Reach us on WhatsApp, call the
            store, or email us during hours below.
          </Text>

          <View style={styles.section}>
            <ActionRow
              icon={
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={22}
                  color="#128C7E"
                />
              }
              title="WhatsApp"
              subtitle={SUPPORT_PHONE_DISPLAY}
              onPress={onWhatsApp}
              accessibilityLabel="Open WhatsApp chat"
            />
            <ActionRow
              icon={
                <Ionicons
                  name="call-outline"
                  size={22}
                  color={Colors.light.darkGreen}
                />
              }
              title="Call store"
              subtitle={SUPPORT_PHONE_DISPLAY}
              onPress={onCall}
              accessibilityLabel={`Call store at ${SUPPORT_PHONE_DISPLAY}`}
            />
            <ActionRow
              icon={
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={Colors.light.darkGreen}
                />
              }
              title="Email"
              subtitle={SUPPORT_EMAIL}
              onPress={onEmail}
              accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
            />
          </View>

          <View style={styles.hoursCard}>
            <View style={styles.hoursHeader}>
              <Ionicons
                name="time-outline"
                size={20}
                color={Colors.light.darkGreen}
              />
              <Text style={styles.hoursTitle}>Store hours</Text>
            </View>
            <Text style={styles.hoursValue}>{hoursLabel}</Text>
            <Text style={styles.hoursMeta}>
              {storeConfig.storeHours.timezone} · every day
            </Text>
            <View
              style={[
                styles.statusPill,
                open ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: open ? "#1B7A4E" : "#B45309" },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: open ? "#1B7A4E" : "#B45309" },
                ]}
              >
                {open ? "Open now" : "Closed now"}
              </Text>
            </View>
            {!storeConfig.acceptingOrders ? (
              <Text style={styles.pauseNote}>
                Orders are paused right now. You can still message us on
                WhatsApp.
              </Text>
            ) : null}
          </View>
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
  },
  lead: {
    fontFamily: "Raleway_500Medium",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.mediumGrey,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  section: {
    gap: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    paddingVertical: Platform.OS === "web" ? 18 : 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.softGrey_1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 15,
    color: Colors.light.darkGrey,
  },
  rowSubtitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
  },
  hoursCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    padding: 18,
    gap: 6,
  },
  hoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  hoursTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 15,
    color: Colors.light.darkGreen,
  },
  hoursValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  },
  hoursMeta: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusOpen: {
    backgroundColor: "rgba(27, 122, 78, 0.1)",
  },
  statusClosed: {
    backgroundColor: "rgba(180, 83, 9, 0.1)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
  },
  pauseNote: {
    marginTop: 8,
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.mediumGrey,
  },
});
