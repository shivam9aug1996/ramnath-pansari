import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";

const Terms = () => {
  return (
    <ScreenSafeWrapper showBackButton={true} title="Term and agreement">
      <ThemedView style={{ flex: 1, paddingTop: 32 }}>
        <ThemedText
          lightColor={Colors.light.mediumLightGrey}
          style={{ lineHeight: 19 }}
        >
          {
            "By using this Site, you agree to be bound by, and to comply with, these Terms and Conditions. If you do not agree to these Terms and Conditions, please do not use this site.\n\n"
          }
          {
            "PLEASE NOTE: We reserve the right, at our sole discretion, to change, modify or otherwise alter these Terms and Conditions at any time. Unless otherwise indicated, amendments will become effective immediately. Please review these Terms and Conditions periodically. Your continued use of the Site following the posting of changes and/or modifications will constitute your acceptance of the revised Terms and Conditions and the reasonableness of these standards for notice of changes. For your information, this page was last updated as of the date at the top of these terms and conditions."
          }
        </ThemedText>
      </ThemedView>
    </ScreenSafeWrapper>
  );
};

export default Terms;

const styles = StyleSheet.create({});
